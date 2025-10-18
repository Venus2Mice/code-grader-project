"""
Module để xử lý function-based grading
Tách riêng logic cho function-based submissions
"""

import docker
import os
import tarfile
import io
import time
from typing import Dict, List

# Try relative import first (when used as module), fallback to direct import
try:
    from .function_parser import FunctionSignatureParser
    from .test_harness_generator import TestHarnessGenerator
except ImportError:
    from function_parser import FunctionSignatureParser
    from test_harness_generator import TestHarnessGenerator


def grade_function_based(submission, problem, test_cases, container, temp_dir_path, submission_id):
    """
    Chấm bài function-based
    
    Args:
        submission: Submission object
        problem: Problem object với grading_mode='function'
        test_cases: List of TestCase objects
        container: Docker container đã được start
        temp_dir_path: Đường dẫn thư mục tạm
        submission_id: ID của submission
    
    Returns:
        Dict chứa overall_status và results list
    """
    print(f"[{submission_id}] Starting FUNCTION-BASED grading...")
    
    final_result = {
        "overall_status": "System Error",
        "results": []
    }
    
    try:
        # 1. Parse function signature
        if not problem.function_signature:
            raise ValueError("Function signature is missing for function-based problem")
        
        print(f"[{submission_id}] Parsing function signature: {problem.function_signature}")
        parsed_signature = FunctionSignatureParser.parse(problem.function_signature)
        
        if not parsed_signature:
            raise ValueError(f"Failed to parse function signature: {problem.function_signature}")
        
        print(f"[{submission_id}] Parsed signature: {parsed_signature}")
        
        # 2. Generate test harness code
        print(f"[{submission_id}] Generating test harness...")
        test_harness_code = TestHarnessGenerator.generate(parsed_signature, submission.source_code)
        
        # 3. Lưu test harness code vào file
        main_cpp_path = os.path.join(temp_dir_path, "main.cpp")
        with open(main_cpp_path, "w", encoding='utf-8') as f:
            f.write(test_harness_code)
        
        print(f"[{submission_id}] Test harness saved to {main_cpp_path}")
        
        # 3.5 Copy test harness to container
        print(f"[{submission_id}] Copying test harness to container...")
        import tarfile
        import io
        tar_data = io.BytesIO()
        with tarfile.open(fileobj=tar_data, mode='w') as tar:
            tarinfo = tarfile.TarInfo(name="main.cpp")
            tarinfo.size = len(test_harness_code.encode('utf-8'))
            tar.addfile(tarinfo, io.BytesIO(test_harness_code.encode('utf-8')))
        tar_data.seek(0)
        
        try:
            container.put_archive("/sandbox", tar_data)
            print(f"[{submission_id}] Copied test harness to container")
        except Exception as e:
            print(f"[{submission_id}] Error copying test harness to container: {e}")
            raise
        
        # 4. Compile code (now with test harness)
        print(f"[{submission_id}] Compiling code...")
        compile_cmd = "g++ -std=c++17 -O1 main.cpp -o main"  # ✅ Also optimized to -O1
        compile_result = container.exec_run(compile_cmd, workdir="/sandbox")
        
        if compile_result.exit_code != 0:
            compile_output = compile_result.output.decode('utf-8', errors='ignore')
            print(f"[{submission_id}] Compile Error:\n{compile_output}")
            final_result["overall_status"] = "Compile Error"
            final_result["results"].append({
                "test_case_id": None,
                "status": "Compile Error",
                "error_message": compile_output
            })
            return final_result
        
        print(f"[{submission_id}] Compilation successful!")
        
        # 5. Chạy từng test case
        overall_status = "Accepted"
        results_list = []
        
        for tc in test_cases:
            print(f"[{submission_id}] Running test case #{tc.id}...")
            
            # Format input data theo test harness format
            # Note: Với function-based, input_data đã được format sẵn
            # Format: line 1 = size (nếu vector), lines tiếp = elements
            input_data = tc.input_data or ""
            
            # 🔧 FIX: Copy input to container, then execute
            # Docker exec_run doesn't support stdin in older versions
            time_limit_sec = problem.time_limit_ms / 1000.0
            
            # Create input file in container via put_archive
            tar_data = io.BytesIO()
            with tarfile.open(fileobj=tar_data, mode='w') as tar:
                tarinfo = tarfile.TarInfo(name="input.txt")
                tarinfo.size = len(input_data.encode('utf-8'))
                tar.addfile(tarinfo, io.BytesIO(input_data.encode('utf-8')))
            tar_data.seek(0)
            
            try:
                container.put_archive("/sandbox", tar_data)
            except Exception as e:
                print(f"[{submission_id}] Error copying input to container: {e}")
            
            # Execute with stdin from file
            try:
                # ✅ ULTIMATE FIX: Use dd to read max 1MB, which SIGPIPE kills the producer
                # When dd stops, ./main gets SIGPIPE and terminates immediately
                exec_cmd = f"sh -c 'timeout {time_limit_sec} ./main < /sandbox/input.txt 2>&1 | dd bs=1024 count=1024 iflag=fullblock 2>/dev/null || true'"
                exec_result = container.exec_run(exec_cmd, workdir="/sandbox")
                exit_code = exec_result.exit_code
                output_bytes = exec_result.output if exec_result.output else b''
                
                # dd limits to exactly 1MB
                if len(output_bytes) > 1048576:
                    output_bytes = output_bytes[:1048576]
                
                output_str = output_bytes.decode('utf-8', errors='ignore').strip().replace('\r\n', '\n')
                error_output = output_str
            except Exception as e:
                print(f"[{submission_id}] Error executing test case #{tc.id}: {e}")
                exit_code = 1
                output_str = ""
                error_output = str(e)
            
            # So sánh output với expected output
            expected_output_str = (tc.expected_output or "").strip().replace('\r\n', '\n')
            
            tc_status = "Accepted"
            error_message = None
            
            # Analyze exit code and determine status
            if exit_code == 124:  # timeout exit code
                tc_status = "Time Limit Exceeded"
                error_message = f"Time limit exceeded ({time_limit_sec}s)\nExit code: {exit_code}"
            elif exit_code == 137:  # SIGKILL - Usually memory limit exceeded
                tc_status = "Memory Limit Exceeded"
                error_message = f"Memory limit exceeded (256MB)\nExit code: {exit_code}\n{error_output}"
            elif exit_code == 139:  # SIGSEGV - Segmentation fault
                tc_status = "Runtime Error"
                error_message = f"Segmentation fault (SIGSEGV)\nExit code: {exit_code}\n{error_output}"
            elif exit_code == 136:  # SIGFPE - Floating point exception (division by zero)
                tc_status = "Runtime Error"
                error_message = f"Floating point exception (SIGFPE)\nExit code: {exit_code}\n{error_output}"
            elif exit_code == 134:  # SIGABRT - Aborted
                tc_status = "Runtime Error"
                error_message = f"Program aborted (SIGABRT)\nExit code: {exit_code}\n{error_output}"
            elif exit_code != 0:
                tc_status = "Runtime Error"
                error_message = f"Exit code: {exit_code}\n{error_output}"
            elif output_str != expected_output_str:
                tc_status = "Wrong Answer"
                # Không cần error message cho Wrong Answer
            
            results_list.append({
                "test_case_id": tc.id,
                "status": tc_status,
                "execution_time_ms": 0,  # TODO: implement timing
                "memory_used_kb": 0,     # TODO: implement memory tracking
                "output_received": output_str,
                "error_message": error_message
            })
            
            print(f"[{submission_id}] Test Case #{tc.id}: Status='{tc_status}'")
            if tc_status != "Accepted":
                print(f"[{submission_id}]   Expected: '{expected_output_str}'")
                print(f"[{submission_id}]   Received: '{output_str}'")
                if error_message:
                    print(f"[{submission_id}]   Error: {error_message}")
            
            # Update overall status
            if tc_status != "Accepted" and overall_status == "Accepted":
                overall_status = tc_status
        
        final_result["overall_status"] = overall_status
        final_result["results"] = results_list
        
        print(f"[{submission_id}] Function-based grading completed. Overall: {overall_status}")
        
    except Exception as e:
        error_message = f"Error during function-based grading: {e}"
        print(f"[{submission_id}] {error_message}")
        import traceback
        traceback.print_exc()
        
        if not final_result["results"]:
            final_result["results"].append({
                "test_case_id": None,
                "status": "System Error",
                "error_message": str(e)
            })
    
    return final_result
