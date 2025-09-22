import docker
import os
import time

# Cấu hình
TIME_LIMIT_SECONDS = 2 # Giới hạn thời gian chạy là 2 giây
SUBMISSIONS_DIR = os.path.join(os.getcwd(), 'submissions', '1') # Đương dẫn tới thư mục bài nộp
DOCKER_IMAGE_NAME = "cpp-grader-env"

def grade_submission():
    # 1. Khởi tạo Docker client
    client = docker.from_env(timeout=120)

    # 2. Lấy đường dẫn tuyệt đối của thư mục bài nộp để mount vào container
    volume_path = os.path.abspath(SUBMISSIONS_DIR)

    # Lệnh để chạy bên trong container
    # Biên dịch , chạy với input và đo thời gian chạy
    # sh -c '...': chạy 1 chuỗi các lệnh shell
    compile_command = "g++ main.cpp -o main"
    run_command = "timeout {} ./main < input1.txt".format(TIME_LIMIT_SECONDS)

    # 3. Chạy container
    container = None
    try:
        print("Starting container...")
        # Tạo và chạy container từ image 'cpp-grader-env'
        # -v {volume_path}:/sandbox: Mount thư mục bài nộp vào thư mục /sandbox trong container
        # mem_limit='128m': Giới hạn bộ nhớ là 128MB
        # detach=True: Chạy ngầm
        container = client.containers.run(
            DOCKER_IMAGE_NAME,
            command=["sh", "-c", f"{compile_command} && {run_command}"],
            volumes={volume_path: {'bind': '/sandbox', 'mode': 'rw'}},
            working_dir="/sandbox",
            mem_limit='128m',
            detach=True
        )

        # 4. Đợi container chạy xong và get kết quả
        # container.wait() sẽ return 1 dict chứa exit code
        result = container.wait(timeout=TIME_LIMIT_SECONDS+1)
        exit_code = result.get('StatusCode', -1)

        # Lấy putput từ container
        container_output = container.logs().decode('utf-8').strip()

        # 5. Phân tích kết quả
        print("-" * 20)
        print(f"Container exited with code: {exit_code}")
        print(f"Program output:\n{container_output}")      

        # Đọc output đúng từ file
        with open(os.path.join(SUBMISSIONS_DIR, 'output1.txt'), 'r') as f:
            expected_output = f.read().strip()
        print(f"Expected output:\n{expected_output}")    

        if exit_code == 124: # Exit code của lệnh 'timeout' khi hết giờ
            print("Result: Time Limit Exceeded (TLE)")
        elif exit_code != 0:
            print("Result: Runtime Error (RE) or Compile Error (CE)")
        elif container_output == expected_output:
            print("Result: Accepted (AC)")
        else:
            print("Result: Wrong Answer (WA)")      

    except docker.errors.ContainerError as e:
        # Lỗi này thường xảy ra khi biên dịch thất bại
        print("-" * 20)
        print("Result: Compile Error (CE)")
        print("Error details:", e.stderr.decode('utf-8'))
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        # 6. Dọn dẹp: Dừng và xóa container
        if container:
            print("Cleaning up container...")
            container.stop()
            container.remove()

if __name__ == "__main__":
    grade_submission()              