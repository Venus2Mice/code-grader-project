# /grader-engine/worker/grader.py
import docker
import os
import uuid
import shutil
import time
import tarfile
import io
import re
import logging
from sqlalchemy.orm import joinedload
from .database import get_db_session
from .models import Submission, TestCase, Problem
from .config import Config
from .grader_function import grade_function_based
from .container_pool import get_global_container_pool

logger = logging.getLogger(__name__)
DOCKER_IMAGE_NAME = "cpp-grader-env"

def cleanup_container_sandbox(container, submission_id):
    """
    ✅ FIX: Clean up container state after each test to prevent contamination
    
    Args:
        container: Docker container to clean
        submission_id: ID for logging
    """
    try:
        # Remove all files in /sandbox except the compiled binary
        cleanup_cmd = "cd /sandbox && rm -f input.txt output.txt exitcode.txt time_output.txt program_stderr.txt run_wrapper.sh 2>/dev/null || true"
        container.exec_run(cleanup_cmd, workdir="/sandbox")
        logger.debug(f"[{submission_id}] Cleaned up sandbox files")
    except Exception as e:
        logger.warning(f"[{submission_id}] Failed to cleanup sandbox: {e}")

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
        compile_cmd = "g++ -std=c++17 -O1 -Wall -Wextra -pedantic -Werror main.cpp -o main"
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
        
        # ❌ DISABLED: Parallel execution causes RACE CONDITION!
        # Multiple test cases running on the SAME container will overwrite each other's:
        # - input.txt
        # - output.txt  
        # - exitcode.txt
        # - program_stderr.txt
        # Result: Test case 2 overwrites output from test case 1!
        #
        # TODO: To re-enable parallel execution, need to either:
        # 1. Create separate subdirectories for each test case (e.g., /sandbox/tc_1/, /sandbox/tc_2/)
        # 2. Use separate containers for each test case
        # 3. Use unique filenames with test case ID (e.g., input_1.txt, output_1.txt)
        
        results_list = []
        
        # ✅ SEQUENTIAL execution - safe and correct
        print(f"[{submission_id}] Running {len(test_cases)} test cases sequentially...")
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
    ✅ FIXED: Run a single test case with proper security and resource tracking
    
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
        
        # ✅ FIX #1: Create input file safely using put_archive (prevents shell injection)
        input_data = tc.input_data or ""
        input_bytes = input_data.encode('utf-8')
        
        # Create tar archive with input.txt
        tar_stream = io.BytesIO()
        with tarfile.open(fileobj=tar_stream, mode='w') as tar:
            tarinfo = tarfile.TarInfo(name='input.txt')
            tarinfo.size = len(input_bytes)
            tar.addfile(tarinfo, io.BytesIO(input_bytes))
        tar_stream.seek(0)
        
        # Put input file into container
        container.put_archive('/sandbox', tar_stream)
        
        # ✅ FIX #2: Properly capture exit code and separate stderr streams
        # 
        # CRITICAL FIX: The previous command had a severe bug where "; echo $?" captured
        # the exit code of the redirection operation, not the program itself.
        # This caused runtime errors (SIGFPE=136, SIGSEGV=139) to appear as exit_code=0,
        # leading to "Wrong Answer" instead of "Runtime Error".
        #
        # Solution: Use a wrapper script that:
        # 1. Runs the program with /usr/bin/time to capture resource metrics
        # 2. Captures the actual program exit code immediately with $?
        # 3. Separates program stderr from time metrics output
        # 4. Properly handles timeout wrapper
        wrapper_script = f'''#!/bin/bash
# Run program with /usr/bin/time to capture metrics, and timeout to enforce limits
# Separate stderr of program from time metrics
/usr/bin/time -v -o /sandbox/time_output.txt timeout {time_limit_sec} ./main < /sandbox/input.txt > /sandbox/output.txt 2> /sandbox/program_stderr.txt

# Capture the ACTUAL program exit code immediately
PROGRAM_EXIT=$?

# Save the actual program exit code
echo $PROGRAM_EXIT > /sandbox/exitcode.txt

# Exit with the program's exit code
exit $PROGRAM_EXIT
'''
        
        # Write wrapper script to container
        script_bytes = wrapper_script.encode('utf-8')
        tar_stream_script = io.BytesIO()
        with tarfile.open(fileobj=tar_stream_script, mode='w') as tar:
            tarinfo = tarfile.TarInfo(name='run_wrapper.sh')
            tarinfo.size = len(script_bytes)
            tarinfo.mode = 0o755  # Make executable
            tar.addfile(tarinfo, io.BytesIO(script_bytes))
        tar_stream_script.seek(0)
        container.put_archive('/sandbox', tar_stream_script)
        
        # Execute wrapper script
        exec_result = container.exec_run(
            ['/bin/bash', '/sandbox/run_wrapper.sh'],
            workdir="/sandbox"
        )
        
        # Read the actual exit code from the program
        try:
            exitcode_result = container.exec_run(
                ['/bin/bash', '-c', 'cat /sandbox/exitcode.txt 2>/dev/null || echo 1'],
                workdir="/sandbox"
            )
            exit_code = int(exitcode_result.output.decode('utf-8', errors='ignore').strip())
        except:
            exit_code = exec_result.exit_code if exec_result.exit_code != 0 else 1
        
        # ✅ FIX #3: Read program output from file (limited to 1MB)
        MAX_OUTPUT_SIZE = 1024 * 1024  # 1MB
        try:
            # Use shell to handle redirection and pipes correctly
            output_result = container.exec_run(
                ['/bin/bash', '-c', f"head -c {MAX_OUTPUT_SIZE} /sandbox/output.txt 2>/dev/null || echo ''"],
                workdir="/sandbox"
            )
            output_bytes = output_result.output if output_result.output else b''
        except:
            output_bytes = b''
        
        output_str = output_bytes.decode('utf-8', errors='ignore').strip().replace('\r\n', '\n')
        
        # ✅ FIX #4: Read program stderr and /usr/bin/time output separately
        execution_time_ms = 0
        memory_used_kb = 0
        error_output = ""
        program_stderr = ""
        
        try:
            # Read program's stderr (actual error messages from the program)
            # Use array format with bash -c to properly handle redirection
            stderr_result = container.exec_run(
                ['/bin/bash', '-c', 'cat /sandbox/program_stderr.txt 2>/dev/null || true'],
                workdir="/sandbox"
            )
            program_stderr = stderr_result.output.decode('utf-8', errors='ignore') if stderr_result.output else ""
            
            # Read /usr/bin/time metrics output
            time_result = container.exec_run(
                ['/bin/bash', '-c', 'cat /sandbox/time_output.txt 2>/dev/null || true'],
                workdir="/sandbox"
            )
            time_output = time_result.output.decode('utf-8', errors='ignore')
            
            # Combine both for error reporting
            error_output = program_stderr if program_stderr else time_output
            
            # Parse /usr/bin/time -v output for resource metrics
            # Example: "Elapsed (wall clock) time (h:mm:ss or m:ss): 0:00.05"
            # Example: "Maximum resident set size (kbytes): 2048"
            for line in time_output.split('\n'):
                if 'Elapsed (wall clock) time' in line:
                    # Extract time in format "0:00.05" or "0.05"
                    import re
                    time_match = re.search(r'(\d+:)?(\d+):(\d+\.\d+)', line)
                    if time_match:
                        hours = int(time_match.group(1)[:-1]) if time_match.group(1) else 0
                        minutes = int(time_match.group(2))
                        seconds = float(time_match.group(3))
                        execution_time_ms = int((hours * 3600 + minutes * 60 + seconds) * 1000)
                    else:
                        # Try simple format "m:ss.ms"
                        time_match = re.search(r'(\d+):(\d+\.\d+)', line)
                        if time_match:
                            minutes = int(time_match.group(1))
                            seconds = float(time_match.group(2))
                            execution_time_ms = int((minutes * 60 + seconds) * 1000)
                
                elif 'Maximum resident set size' in line:
                    # Extract memory in kbytes
                    mem_match = re.search(r'(\d+)', line)
                    if mem_match:
                        memory_used_kb = int(mem_match.group(1))
            
            # ✅ CRITICAL FIX: Enhanced error detection from program stderr
            # Check program's stderr for signal names/messages
            stderr_lower = program_stderr.lower()
            
            if 'floating point exception' in stderr_lower or 'sigfpe' in stderr_lower or 'fpe' in stderr_lower:
                if exit_code == 0:  # Override if not already set
                    exit_code = 136
            elif 'segmentation fault' in stderr_lower or 'sigsegv' in stderr_lower or 'segfault' in stderr_lower:
                if exit_code == 0:
                    exit_code = 139
            elif 'killed' in stderr_lower and exit_code == 0:
                exit_code = 137
            elif 'aborted' in stderr_lower or 'sigabrt' in stderr_lower:
                if exit_code == 0:
                    exit_code = 134
                    
        except Exception as e:
            logger.warning(f"[{submission_id}] Failed to parse time metrics: {e}")
            
            
    except Exception as e:
        print(f"[{submission_id}] Error executing test case #{tc.id}: {e}")
        logger.error(f"[{submission_id}] Test case execution error: {e}", exc_info=True)
        exit_code = 1
        execution_time_ms = 0
        memory_used_kb = 0
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
    
    # ✅ FIX #5: Return real metrics instead of hardcoded 0
    result = {
        "test_case_id": tc.id,
        "status": tc_status,
        "execution_time_ms": execution_time_ms,  # Real time from /usr/bin/time
        "memory_used_kb": memory_used_kb,        # Real memory from /usr/bin/time
        "output_received": output_str,
        "error_message": error_message
    }
    
    # ✅ FIX #6: Cleanup sandbox after each test case
    cleanup_container_sandbox(container, submission_id)
    
    print(f"[{submission_id}] Test Case #{tc.id}: Status='{tc_status}', Time={execution_time_ms}ms, Memory={memory_used_kb}KB")
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
        # Ensure sandbox directory exists in container
        try:
            container.exec_run("mkdir -p /sandbox", workdir="/")
            logger.debug(f"[{submission_id}] Ensured /sandbox directory exists in container")
        except Exception as e:
            logger.warning(f"[{submission_id}] Failed to ensure /sandbox directory: {e}")

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