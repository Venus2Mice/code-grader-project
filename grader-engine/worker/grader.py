# /grader-engine/worker/grader.py
import docker
import os
import uuid
import shutil
from .database import get_db_session
from .models import Submission, TestCase
from .config import Config

DOCKER_IMAGE_NAME = "cpp-grader-env"

def run_single_test_case(container, input_data, time_limit_sec):
    """Thực thi một test case duy nhất bên trong container."""
    try:
        # Chạy lệnh thực thi với input và giới hạn thời gian
        # Lệnh `timeout` của Linux sẽ tự động kill process nếu quá giờ
        command = f"timeout {time_limit_sec} ./main"
        exit_code, (stdout, stderr) = container.exec_run(cmd=command, stdin=True, demux=True, workdir="/sandbox")

        # stdin=True cho phép chúng ta truyền input_data vào
        # Chúng ta cần gửi input qua socket mà exec_run trả về
        if stdout:
            # Tìm socket và gửi dữ liệu
            sock = container.attach_socket(params={'stdin': 1, 'stream': 1})
            sock._sock.sendall(input_data.encode('utf-8'))
            sock.close()
            
            # Đọc output sau khi gửi stdin
            output = container.logs(stdout=True, stderr=False, tail=1).decode('utf-8').strip()
            return exit_code, output

        return exit_code, ""
    except Exception as e:
        print(f"Error running test case: {e}")
        return -1, str(e)


import docker
import os
import uuid
import shutil
import time
from .database import get_db_session
from .models import Submission, TestCase # Đảm bảo import đúng
from .config import Config # Import Config để lấy DOCKER_IMAGE_NAME

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
        temp_dir_name = f"submission_{submission_id}_{uuid.uuid4()}"
        temp_dir_path = os.path.abspath(temp_dir_name)
        os.makedirs(temp_dir_path, exist_ok=True)
        
        with open(os.path.join(temp_dir_path, "main.cpp"), "w") as f:
            f.write(submission.source_code)

        # 3. Chạy và chuẩn bị container
        mount_volume = docker.types.Mount(target="/sandbox", source=temp_dir_path, type="bind")
        print(f"[{submission_id}] Creating sandbox container from image '{Config.DOCKER_IMAGE_NAME}'...")
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

        # 4. Biên dịch code bên trong container
        print(f"[{submission_id}] Compiling source code...")
        compile_cmd = "g++ -std=c++17 -O2 -static main.cpp -o main"
        compile_result = container.exec_run(compile_cmd)
        
        if compile_result.exit_code != 0:
            compile_output = compile_result.output.decode('utf-8', errors='ignore')
            print(f"[{submission_id}] Compile Error:\n{compile_output}")
            final_result["overall_status"] = "Compile Error"
            final_result["results"].append({
                "test_case_id": None,
                "status": "Compile Error",
                "error_message": compile_output
            })
        else:
            # 5. Nếu biên dịch thành công, chạy từng test case
            print(f"[{submission_id}] Compilation successful. Running test cases...")
            overall_status = "Accepted"
            results_list = []
            
            for tc in test_cases:
                with open(os.path.join(temp_dir_path, "input.txt"), "w") as f_in:
                    f_in.write(tc.input_data or "")
                
                time_limit_sec = problem.time_limit_ms / 1000.0
                exec_cmd = f"timeout {time_limit_sec} ./main < input.txt"
                exit_code, output_bytes = container.exec_run(exec_cmd)
                
                output_str = output_bytes.decode('utf-8', errors='ignore').strip().replace('\r\n', '\n')
                expected_output_str = (tc.expected_output or "").strip().replace('\r\n', '\n')

                tc_status = "Accepted"
                if exit_code == 124:
                    tc_status = "Time Limit Exceeded"
                elif exit_code != 0:
                    tc_status = "Runtime Error"
                elif output_str != expected_output_str:
                    tc_status = "Wrong Answer"
                
                results_list.append({
                    "test_case_id": tc.id,
                    "status": tc_status,
                    "execution_time_ms": 0, # Cần giải pháp đo thời gian phức tạp hơn
                    "memory_used_kb": 0,    # Tương tự
                    "output_received": output_str
                })
                print(f"[{submission_id}] Test Case #{tc.id}: {tc_status}")

                if tc_status != "Accepted" and overall_status == "Accepted":
                    overall_status = tc_status

            final_result["overall_status"] = overall_status
            final_result["results"] = results_list

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