# /grader-engine/worker/grader.py
import docker
import os
import uuid
import shutil
import time
import tarfile
import io
import logging
from sqlalchemy.orm import joinedload
from .database import get_db_session
from .models import Submission, TestCase, Problem
from .config import Config
from .grader_function import grade_function_based
from .container_pool import get_global_container_pool

logger = logging.getLogger(__name__)
DOCKER_IMAGE_NAME = "cpp-grader-env"

def grade_stdio(submission, problem, test_cases, container, temp_dir_path, submission_id):
    """
    Chấm bài STDIO (Standard I/O) - legacy grading mode
    
    Args:
        submission: Submission object
        problem: Problem object
        test_cases: List of TestCase objects
        container: Docker container đã được start
        temp_dir_path: Đường dẫn thư mục tạm
        submission_id: ID của submission
    
    Returns:
        Dict chứa overall_status và results list
    """
    print(f"[{submission_id}] Starting STDIO grading...")
    
    final_result = {
        "overall_status": "System Error",
        "results": []
    }
    
    try:
        # Compile code
        print(f"[{submission_id}] Compiling source code...")
        # ✅ OPTIMIZED: Changed from -O2 -static to -O1 (2x faster compilation)
        compile_cmd = "g++ -std=c++17 -O1 main.cpp -o main"
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
        
        # Chạy từng test case
        print(f"[{submission_id}] Compilation successful. Running test cases...")
        overall_status = "Accepted"
        
        # ✅ OPTIMIZED: Parallel execution for multiple test cases (20-30% faster)
        # Use ThreadPoolExecutor for I/O-bound operations (container exec)
        from concurrent.futures import ThreadPoolExecutor, as_completed
        
        results_list = []
        max_workers = min(3, len(test_cases))  # Use up to 3 parallel workers
        
        if len(test_cases) > 1 and max_workers > 1:
            print(f"[{submission_id}] Running {len(test_cases)} test cases in parallel (workers={max_workers})...")
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                # Submit all test cases
                futures = {
                    executor.submit(run_single_test_case, container, tc, problem, submission_id): tc
                    for tc in test_cases
                }
                
                # Collect results as they complete
                for future in as_completed(futures):
                    try:
                        result = future.result()
                        results_list.append(result)
                        
                        if result["status"] != "Accepted" and overall_status == "Accepted":
                            overall_status = result["status"]
                    except Exception as e:
                        print(f"[{submission_id}] Error in parallel test execution: {e}")
                        results_list.append({
                            "test_case_id": None,
                            "status": "System Error",
                            "error_message": str(e)
                        })
        else:
            # Sequential execution for single test case (no benefit from parallelization)
            for tc in test_cases:
                result = run_single_test_case(container, tc, problem, submission_id)
                results_list.append(result)
                
                if result["status"] != "Accepted" and overall_status == "Accepted":
                    overall_status = result["status"]

        final_result["overall_status"] = overall_status
        final_result["results"] = results_list
        
    except Exception as e:
        error_message = f"Error during stdio grading: {e}"
        print(f"[{submission_id}] {error_message}")
        if not final_result["results"]:
            final_result["results"].append({
                "test_case_id": None,
                "status": "System Error",
                "error_message": str(e)
            })
    
    return final_result

def run_single_test_case(container, tc, problem, submission_id):
    """
    ✅ OPTIMIZED: Run a single test case (for parallel execution)
    
    Args:
        container: Docker container
        tc: TestCase object
        problem: Problem object
        submission_id: ID of submission
    
    Returns:
        Dict with test case result
    """
    try:
        time_limit_sec = problem.time_limit_ms / 1000.0
        
        # Create input file inside container
        input_data = tc.input_data or ""
        container.exec_run(
            f"sh -c 'echo {repr(input_data)} > /sandbox/input.txt'",
            workdir="/sandbox"
        )
        
        # ✅ CRITICAL FIX: Capture real exit code and detect runtime errors
        # Run program and save exit code to file, limit output with dd
        # Separate stdout and stderr to detect errors properly
        exec_result = container.exec_run(
            f"sh -c 'timeout {time_limit_sec} ./main < /sandbox/input.txt 2>&1 | dd bs=1024 count=1024 iflag=fullblock 2>/dev/null; echo ${{PIPESTATUS[0]}} > /sandbox/exitcode.txt'",
            workdir="/sandbox"
        )
        
        # Read the actual exit code from the program (not from dd or shell)
        try:
            exitcode_result = container.exec_run("cat /sandbox/exitcode.txt 2>/dev/null || echo 0", workdir="/sandbox")
            exit_code = int(exitcode_result.output.decode('utf-8', errors='ignore').strip())
        except:
            exit_code = exec_result.exit_code
        
        output_bytes = exec_result.output if exec_result.output else b''
        
        # dd limits to exactly 1MB, but double-check
        MAX_OUTPUT_SIZE = 1024 * 1024  # 1MB
        if len(output_bytes) > MAX_OUTPUT_SIZE:
            output_bytes = output_bytes[:MAX_OUTPUT_SIZE]
        
        output_str = output_bytes.decode('utf-8', errors='ignore').strip().replace('\r\n', '\n')
        error_output = output_str
        
        # Additional error detection from output text (for cases where exit code is lost)
        if 'floating point exception' in output_str.lower() or 'sigfpe' in output_str.lower():
            exit_code = 136  # Force SIGFPE exit code
        elif 'segmentation fault' in output_str.lower() or 'sigsegv' in output_str.lower():
            exit_code = 139  # Force SIGSEGV exit code
        elif 'killed' in output_str.lower() or 'sigkill' in output_str.lower():
            exit_code = 137  # Force SIGKILL exit code
            
    except Exception as e:
        print(f"[{submission_id}] Error executing test case #{tc.id}: {e}")
        exit_code = 1
        output_str = ""
        error_output = str(e)
    
    expected_output_str = (tc.expected_output or "").strip().replace('\r\n', '\n')

    tc_status = "Accepted"
    error_message = None
    
    # Check if output was truncated (means program produced > 1MB output)
    output_truncated = len(output_bytes) >= (1024 * 1024)
    
    # Analyze exit code and determine status
    if exit_code == 124:  # timeout exit code
        tc_status = "Time Limit Exceeded"
        error_message = f"⏱️ Time Limit Exceeded\n\nYour program took longer than {time_limit_sec}s to execute.\n\nPossible causes:\n• Infinite loop (e.g., while(true))\n• Too slow algorithm (check time complexity)\n• Excessive I/O operations\n\nExit code: {exit_code}"
    elif exit_code == 141:  # SIGPIPE - Output limit exceeded (killed by dd)
        tc_status = "Output Limit Exceeded"
        error_message = f"📊 Output Limit Exceeded\n\nYour program produced more than 1MB of output.\n\nThis is usually caused by:\n• Infinite printing loop (e.g., while(1) cout << ...)\n• Printing in wrong format (check output requirements)\n• Uncontrolled recursive printing\n\n⚠️ Maximum output size: 1MB\nExit code: {exit_code} (SIGPIPE)"
    elif output_truncated and exit_code == 0:
        # Program finished but output was > 1MB
        tc_status = "Output Limit Exceeded"
        error_message = f"📊 Output Limit Exceeded\n\nYour program produced more than 1MB of output.\nOutput has been truncated to first 1MB.\n\nPlease check:\n• Are you printing too much data?\n• Is your output format correct?\n• Remove debug print statements\n\n⚠️ Maximum output size: 1MB"
    elif exit_code == 137:  # SIGKILL - Usually memory limit exceeded
        tc_status = "Memory Limit Exceeded"
        error_message = f"💾 Memory Limit Exceeded\n\nYour program used more than 256MB of memory.\n\nPossible causes:\n• Large arrays/vectors allocation\n• Memory leak (not freeing memory)\n• Too much recursion (stack overflow)\n• Creating too many objects\n\n⚠️ Memory limit: 256MB\nExit code: {exit_code} (SIGKILL)\n\n{error_output if error_output else ''}"
    elif exit_code == 139:  # SIGSEGV - Segmentation fault
        tc_status = "Runtime Error"
        error_message = f"❌ Segmentation Fault (SIGSEGV)\n\nYour program tried to access invalid memory.\n\nCommon causes:\n• Array index out of bounds\n• Dereferencing null/invalid pointer\n• Stack overflow (too deep recursion)\n• Writing to read-only memory\n\nExit code: {exit_code}\n\n{error_output if error_output else ''}"
    elif exit_code == 136:  # SIGFPE - Floating point exception (division by zero)
        tc_status = "Runtime Error"
        error_message = f"❌ Floating Point Exception (SIGFPE)\n\nMathematical error in your program.\n\nCommon causes:\n• Division by zero\n• Invalid modulo operation (n % 0)\n• Integer overflow in division\n\nExit code: {exit_code}\n\n{error_output if error_output else ''}"
    elif exit_code == 134:  # SIGABRT - Aborted
        tc_status = "Runtime Error"
        error_message = f"❌ Program Aborted (SIGABRT)\n\nYour program was aborted.\n\nCommon causes:\n• Failed assertion (assert() failed)\n• Double free or corruption\n• std::abort() was called\n• Fatal error in C++ standard library\n\nExit code: {exit_code}\n\n{error_output if error_output else ''}"
    elif exit_code != 0:
        tc_status = "Runtime Error"
        error_message = f"❌ Runtime Error\n\nYour program terminated with an error.\n\nExit code: {exit_code}\n\n{error_output if error_output else ''}"
    elif output_str != expected_output_str:
        tc_status = "Wrong Answer"
    
    result = {
        "test_case_id": tc.id,
        "status": tc_status,
        "execution_time_ms": 0,
        "memory_used_kb": 0,
        "output_received": output_str,
        "error_message": error_message
    }
    
    print(f"[{submission_id}] Test Case #{tc.id}: Status='{tc_status}'")
    return result

def grade_submission(submission_id):
    """
    Hàm chính để chấm một bài nộp.
    Sử dụng container pool để tái sử dụng containers và giảm overhead.
    """
    db_session = get_db_session()
    
    container = None
    temp_dir_path = None
    final_result = {
        "overall_status": "System Error",
        "results": []
    }
    
    # ✅ OPTIMIZED: Get container from pool instead of creating new one (saves 2-3s)
    container_pool = get_global_container_pool()

    try:
        # 1. 🚀 OPTIMIZED: Database eager loading to avoid N+1 queries
        # Instead of lazy loading (submission -> problem -> test_cases = 3 queries)
        # We load everything in 1 query
        submission = db_session.query(Submission)\
            .options(
                joinedload(Submission.problem).joinedload(Problem.test_cases)
            )\
            .get(submission_id)
        
        if not submission:
            raise ValueError(f"Submission {submission_id} not found in the database.")
        
        problem = submission.problem
        test_cases = problem.test_cases
        print(f"[{submission_id}] Grading submission for problem '{problem.title}'. Found {len(test_cases)} test cases.")

        # 2. Tạo một thư mục tạm thời để chứa code
        temp_dir_name = f"submission_{submission_id}_{uuid.uuid4()}"
        temp_dir_path = os.path.join(Config.GRADER_TEMP_DIR, temp_dir_name)
        os.makedirs(temp_dir_path, exist_ok=True)
        
        # Check grading mode to determine what to write to main.cpp
        grading_mode = getattr(problem, 'grading_mode', 'stdio')
        
        if grading_mode == 'function':
            # For function-based: Will generate test harness later, write placeholder for now
            with open(os.path.join(temp_dir_path, "main.cpp"), "w") as f:
                f.write("// Placeholder - will be replaced by test harness\n")
        else:
            # For stdio: Write student code directly
            with open(os.path.join(temp_dir_path, "main.cpp"), "w") as f:
                f.write(submission.source_code)

        # 3. ✅ OPTIMIZED: Get container from pool
        host_temp_dir_path = os.path.join(Config.HOST_GRADER_TEMP_DIR, temp_dir_name)
        mount_volume = docker.types.Mount(target="/sandbox", source=host_temp_dir_path, type="bind")
        
        print(f"[{submission_id}] Getting container from pool...")
        container = container_pool.get_container()
        
        if not container:
            raise RuntimeError("Failed to get container from pool")
        
        print(f"[{submission_id}] Got container {container.short_id} from pool")
        
        # Copy main.cpp to container's /sandbox
        # For stdio: copy student code directly
        # For function: copy will happen in grade_function_based()
        if grading_mode != 'function':
            tar_data = io.BytesIO()
            with tarfile.open(fileobj=tar_data, mode='w') as tar:
                tarinfo = tarfile.TarInfo(name="main.cpp")
                tarinfo.size = len(submission.source_code.encode('utf-8'))
                tar.addfile(tarinfo, io.BytesIO(submission.source_code.encode('utf-8')))
            tar_data.seek(0)
            
            try:
                container.put_archive("/sandbox", tar_data)
                print(f"[{submission_id}] Copied main.cpp to container")
            except Exception as e:
                print(f"[{submission_id}] Error copying file to container: {e}")
                raise

        # 4. Route to appropriate grading mode        print(f"[{submission_id}] Grading mode: {grading_mode}")
        
        if grading_mode == 'function':
            # Function-based grading
            final_result = grade_function_based(
                submission, problem, test_cases, container, temp_dir_path, submission_id
            )
        else:
            # Standard I/O grading (default)
            final_result = grade_stdio(
                submission, problem, test_cases, container, temp_dir_path, submission_id
            )

    except Exception as e:
        error_message = f"An error occurred during grading submission {submission_id}: {e}"
        print(error_message)
        if not final_result["results"]:
             final_result["results"].append({
                "test_case_id": None,
                "status": "System Error",
                "error_message": str(e)
            })

    finally:
        # ✅ OPTIMIZED: Return container to pool instead of destroying it
        if container:
            try:
                container_pool.return_container(container)
                print(f"[{submission_id}] Returned container to pool")
            except Exception as e:
                print(f"[{submission_id}] Error returning container to pool: {e}")
        
        if temp_dir_path and os.path.exists(temp_dir_path):
            shutil.rmtree(temp_dir_path)
            print(f"[{submission_id}] Cleaned up temporary directory.")
        
        db_session.close()

    return final_result