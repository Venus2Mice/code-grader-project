# /grader-engine/worker/grader.py
import docker
import os
import uuid
import shutil
from .database import get_db_session
from .models import Submission, TestCase

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


def grade_submission(submission_id):
    """
    Hàm chính để chấm một bài nộp.
    Kết nối CSDL, lấy thông tin, chạy Docker, và trả về kết quả.
    """
    db_session = get_db_session()
    client = docker.from_env(timeout=120)
    results = []
    overall_status = "Accepted" # Giả định ban đầu là đúng

    try:
        # 1. Truy vấn CSDL để lấy thông tin cần thiết
        submission = db_session.query(Submission).get(submission_id)
        if not submission:
            print(f"Submission {submission_id} not found.")
            return None
        
        problem = submission.problem
        test_cases = problem.test_cases

        # 2. Tạo một thư mục tạm thời để chứa code và I/O
        temp_dir_name = f"submission_{submission_id}_{uuid.uuid4()}"
        temp_dir_path = os.path.abspath(temp_dir_name)
        os.makedirs(temp_dir_path, exist_ok=True)
        
        # Ghi mã nguồn vào file main.cpp
        with open(os.path.join(temp_dir_path, "main.cpp"), "w") as f:
            f.write(submission.source_code)

        # 3. Biên dịch code bên trong container
        container = None
        try:
            mount_volume = docker.types.Mount(target="/sandbox", source=temp_dir_path, type="bind")
            container = client.containers.run(
                DOCKER_IMAGE_NAME,
                mounts=[mount_volume],
                working_dir="/sandbox",
                command="sleep 3600", # Giữ container chạy để ta có thể exec
                detach=True
            )

            compile_cmd = "g++ -std=c++17 -O2 -static main.cpp -o main"
            compile_result = container.exec_run(compile_cmd)

            if compile_result.exit_code != 0:
                overall_status = "Compile Error"
                # (Tùy chọn) có thể lưu compile_result.output vào kết quả
                print(f"Compile Error for submission {submission_id}")
            else:
                # 4. Nếu biên dịch thành công, chạy từng test case
                for tc in test_cases:
                    time_limit_sec = problem.time_limit_ms / 1000.0
                    
                    # Chạy lệnh thực thi với input và giới hạn thời gian
                    exec_cmd = f"timeout {time_limit_sec} ./main"
                    # exec_run trả về exit_code và một stream output
                    exit_code, (stdout_stream, stderr_stream) = container.exec_run(
                        cmd=exec_cmd,
                        stdin=True, # Báo cho Docker rằng chúng ta sẽ gửi dữ liệu vào stdin
                        socket=True  # Sử dụng socket để tương tác
                    )
                    
                    # Lấy socket để gửi dữ liệu stdin
                    sock = stdout_stream._sock
                    if tc.input_data:
                        sock.sendall(tc.input_data.encode('utf-8'))
                    sock.close() # Đóng stream để báo hiệu EOF

                    # Đợi command chạy xong và lấy log output
                    # Đọc log sau khi command đã kết thúc
                    output = container.logs(stdout=True, stderr=False, tail="all").decode('utf-8').strip()
                    # Cần có cách để lấy output của lần exec_run cuối cùng.
                    # Cách tiếp cận tốt hơn là redirect output ra file và đọc file đó.
                    # Ví dụ: f"timeout {time_limit_sec} ./main < input.txt > output.txt"
                    # Sau đó đọc file output.txt
                    
                    # Đoạn code trên có thể phức tạp, đây là cách đơn giản và tin cậy hơn:
                    # Tạo file input và chạy lệnh redirect
                    with open(os.path.join(temp_dir_path, "input.txt"), "w") as f_in:
                        f_in.write(tc.input_data or "")
                    
                    exec_cmd_redirect = f"timeout {time_limit_sec} ./main < input.txt"
                    exit_code, output_bytes = container.exec_run(exec_cmd_redirect)
                    output_str = output_bytes.decode('utf-8').strip().replace('\r\n', '\n')
                    expected_output_str = (tc.expected_output or "").strip().replace('\r\n', '\n')


                    tc_status = "Accepted"
                    if exit_code == 124: # exit code của timeout
                        tc_status = "Time Limit Exceeded"
                    elif exit_code != 0:
                        tc_status = "Runtime Error"
                    elif output_str != expected_output_str:
                        tc_status = "Wrong Answer"
                    
                    results.append({
                        "test_case_id": tc.id,
                        "status": tc_status,
                        "execution_time_ms": 0, # Cần cách đo chính xác hơn (vd: /usr/bin/time)
                        "memory_used_kb": 0,    # Tương tự
                        "output_received": output_str
                    })

                    # Nếu một test case sai, toàn bộ bài nộp sẽ không được Accepted
                    if tc_status != "Accepted":
                        overall_status = tc_status
                        # Bạn có thể chọn dừng lại ngay ở đây (fail-fast)
                        # break 

        finally:
            if container:
                container.stop()
                container.remove()
            # 5. Dọn dẹp thư mục tạm
            shutil.rmtree(temp_dir_path)

    except Exception as e:
        print(f"An error occurred during grading submission {submission_id}: {e}")
        overall_status = "System Error"
    finally:
        db_session.close()

    return {
        "overall_status": overall_status,
        "results": results
    }