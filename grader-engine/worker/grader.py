# /grader-engine/worker/grader.py
import docker
import os
import uuid
import shutil
import time
import tarfile
import io
from .database import get_db_session
from .models import Submission, TestCase
from .config import Config
from .grader_function import grade_function_based

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
        compile_cmd = "g++ -std=c++17 -O2 -static main.cpp -o main"
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
        results_list = []
        
        for tc in test_cases:
            # Ghi input vào file
            with open(os.path.join(temp_dir_path, "input.txt"), "w") as f_in:
                f_in.write(tc.input_data or "")
            
            time_limit_sec = problem.time_limit_ms / 1000.0
            
            # Chạy lệnh và redirect I/O
            exec_cmd = f"sh -c 'cat /sandbox/input.txt | timeout {time_limit_sec} ./main > /sandbox/output.txt'"
            exit_code, _ = container.exec_run(exec_cmd, workdir="/sandbox")

            output_str = ""
            try:
                # Lấy output từ container
                bits, stat = container.get_archive('/sandbox/output.txt')
                with tarfile.open(fileobj=io.BytesIO(b"".join(bits))) as tar:
                    member = tar.getmember('output.txt')
                    f = tar.extractfile(member)
                    if f:
                        output_str = f.read().decode('utf-8', errors='ignore').strip().replace('\r\n', '\n')
            except docker.errors.NotFound:
                print(f"[{submission_id}] output.txt not found for test case #{tc.id}")
                output_str = ""
            except (tarfile.TarError, KeyError):
                print(f"[{submission_id}] Failed to extract output.txt for test case #{tc.id}")
                output_str = ""
            
            expected_output_str = (tc.expected_output or "").strip().replace('\r\n', '\n')

            tc_status = "Accepted"
            if exit_code == 124:  # timeout exit code
                tc_status = "Time Limit Exceeded"
            elif exit_code != 0:
                tc_status = "Runtime Error"
            elif output_str != expected_output_str:
                tc_status = "Wrong Answer"
            
            results_list.append({
                "test_case_id": tc.id,
                "status": tc_status,
                "execution_time_ms": 0,
                "memory_used_kb": 0,
                "output_received": output_str
            })
            print(f"[{submission_id}] Test Case #{tc.id}: Status='{tc_status}'")

            if tc_status != "Accepted" and overall_status == "Accepted":
                overall_status = tc_status

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

def grade_submission(submission_id):
    """
    Hàm chính để chấm một bài nộp.
    Kết nối CSDL, lấy thông tin, chạy Docker, và trả về kết quả.
    """
    db_session = get_db_session()
    client = docker.from_env()
    
    container = None
    temp_dir_path = None
    final_result = {
        "overall_status": "System Error",
        "results": []
    }

    try:
        # 1. Truy vấn CSDL để lấy thông tin cần thiết
        submission = db_session.query(Submission).get(submission_id)
        if not submission:
            raise ValueError(f"Submission {submission_id} not found in the database.")
        
        problem = submission.problem
        test_cases = problem.test_cases
        print(f"[{submission_id}] Grading submission for problem '{problem.title}'. Found {len(test_cases)} test cases.")

        # 2. Tạo một thư mục tạm thời để chứa code và I/O
        # Sử dụng thư mục được mount từ host để Docker daemon có thể truy cập
        temp_dir_name = f"submission_{submission_id}_{uuid.uuid4()}"
        temp_dir_path = os.path.join(Config.GRADER_TEMP_DIR, temp_dir_name)
        os.makedirs(temp_dir_path, exist_ok=True)
        
        with open(os.path.join(temp_dir_path, "main.cpp"), "w") as f:
            f.write(submission.source_code)

        # 3. Chạy và chuẩn bị container
        # Khi mount volume cho Docker-in-Docker, cần sử dụng đường dẫn thực tế trên host
        host_temp_dir_path = os.path.join(Config.HOST_GRADER_TEMP_DIR, temp_dir_name)
        mount_volume = docker.types.Mount(target="/sandbox", source=host_temp_dir_path, type="bind")
        print(f"[{submission_id}] Creating sandbox container from image '{Config.DOCKER_IMAGE_NAME}'...")
        print(f"[{submission_id}] Mounting host path: {host_temp_dir_path} -> /sandbox")
        container = client.containers.run(
            Config.DOCKER_IMAGE_NAME,
            command=["sleep", "3600"],
            mounts=[mount_volume],
            working_dir="/sandbox",
            detach=True,
            mem_limit='256m'
        )

        # Đợi và kiểm tra trạng thái container, có báo cáo lỗi chi tiết
        print(f"[{submission_id}] Waiting for container {container.short_id} to start...")
        for i in range(10):
            time.sleep(1)
            container.reload()
            print(f"[{submission_id}] Attempt {i+1}: Container status is '{container.status}'")
            if container.status == 'running':
                print(f"[{submission_id}] Container is running.")
                break
            if container.status == 'exited':
                break
        
        if container.status != 'running':
            exit_info = container.wait()
            exit_code = exit_info.get('StatusCode', 'N/A')
            logs = container.logs().decode('utf-8', errors='ignore')
            error_message = (
                f"Container {container.short_id} failed to stay running. "
                f"Final status: {container.status}, Exit Code: {exit_code}. "
                f"Logs: {logs if logs else 'No logs available.'}"
            )
            raise RuntimeError(error_message)

        # 4. Route to appropriate grading mode
        # Kiểm tra grading_mode để quyết định cách chấm
        grading_mode = getattr(problem, 'grading_mode', 'stdio')  # default to stdio for backward compatibility
        
        print(f"[{submission_id}] Grading mode: {grading_mode}")
        
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
        # Đảm bảo final_result có cấu trúc nhất quán khi có lỗi hệ thống
        if not final_result["results"]:
             final_result["results"].append({
                "test_case_id": None,
                "status": "System Error",
                "error_message": str(e)
            })

    finally:
        if container:
            try:
                container.reload()
                # Chỉ stop nếu nó đang chạy
                if container.status == 'running':
                    container.stop()
                container.remove(force=True)
                print(f"[{submission_id}] Cleaned up container {container.short_id}.")
            except docker.errors.NotFound:
                print(f"[{submission_id}] Container not found during cleanup.")
        
        if temp_dir_path and os.path.exists(temp_dir_path):
            shutil.rmtree(temp_dir_path)
            print(f"[{submission_id}] Cleaned up temporary directory.")
        
        db_session.close()

    return final_result