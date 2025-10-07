# /grader-engine/worker/main.py
import pika
import json
import requests
from .config import Config
from .grader import grade_submission
import time

def update_backend(submission_id, result_data):
    """Gửi kết quả chấm bài về cho Backend API."""
    url = f"{Config.BACKEND_API_URL}/internal/submissions/{submission_id}/result"
    try:
        response = requests.post(url, json=result_data)
        response.raise_for_status() # Ném exception nếu status code là 4xx hoặc 5xx
        print(f"Successfully updated backend for submission {submission_id}")
    except requests.exceptions.RequestException as e:
        print(f"Error updating backend for submission {submission_id}: {e}")
        # Cần có cơ chế retry ở đây để đảm bảo kết quả không bị mất

def callback(ch, method, properties, body):
    """Hàm được gọi khi có task mới từ RabbitMQ."""
    print(f" [x] Received task: {body.decode()}")
    
    try:
        task_data = json.loads(body.decode())
        submission_id = task_data.get('submission_id')
        
        if submission_id:
            # Bắt đầu quá trình chấm điểm
            result = grade_submission(submission_id)
            print(result)
            
            if result:
                # Gửi kết quả về backend
                update_backend(submission_id, result)
            
            # Gửi tín hiệu ack để xóa task khỏi queue
            ch.basic_ack(delivery_tag=method.delivery_tag)
        else:
            print("Invalid task data, discarding.")
            ch.basic_ack(delivery_tag=method.delivery_tag)
            
    except Exception as e:
        print(f"An error occurred in callback: {e}")
        # Gửi nack để RabbitMQ có thể giao lại task này sau
        ch.basic_nack(delivery_tag=method.delivery_tag)

def main():
    """Hàm chính khởi động worker với cơ chế retry."""
    print("Starting worker...")
    
    # --- Bắt đầu phần sửa đổi ---
    connection = None
    retry_interval = 5  # Đợi 5 giây giữa các lần thử
    max_retries = 10     # Thử tối đa 10 lần
    
    for i in range(max_retries):
        try:
            print(f"Connecting to RabbitMQ at {Config.RABBITMQ_HOST}... (Attempt {i+1}/{max_retries})")
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(host=Config.RABBITMQ_HOST)
            )
            print("Successfully connected to RabbitMQ.")
            break # Thoát khỏi vòng lặp nếu kết nối thành công
        except pika.exceptions.AMQPConnectionError:
            print(f"Connection failed. Retrying in {retry_interval} seconds...")
            time.sleep(retry_interval)
    
    if not connection:
        print("Could not connect to RabbitMQ after several attempts. Exiting.")
        return # Thoát khỏi hàm main nếu không thể kết nối
    # --- Kết thúc phần sửa đổi ---
    
    channel = connection.channel()
    
    channel.queue_declare(queue='grading_queue', durable=True)
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='grading_queue', on_message_callback=callback)
    
    print(' [*] Waiting for tasks. To exit press CTRL+C')
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print('Interrupted')
    finally:
        if connection.is_open:
            connection.close()
            print("RabbitMQ connection closed.")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('Interrupted')
        # (Optional) Clean up code