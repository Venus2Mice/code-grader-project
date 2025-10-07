import pika
import json
import time
import os

# --- Giả lập lại hàm chấm bài từ bước trước ---
def grade_submission(submission_id):
    print(f"--- Received submission {submission_id}. Starting grading process. ---")
    time.sleep(5) 
    result = {'status': 'Accepted', 'execution_time': 120}
    print(f"--- Finished grading {submission_id}. Result: {result['status']} ---")
    return True

# --- Phần chính: Lắng nghe RabbitMQ với Retry Logic ---

def connect_to_rabbitmq():
    """Hàm này sẽ thử kết nối lại cho đến khi thành công."""
    connection = None
    retry_delay = 5  # Đợi 5 giây giữa các lần thử
    while not connection:
        try:
            # Cố gắng kết nối
            connection = pika.BlockingConnection(pika.ConnectionParameters('locallhost'))
            print(' [*] Successfully connected to RabbitMQ.')
            return connection
        except pika.exceptions.AMQPConnectionError:
            # Nếu thất bại, đợi và thử lại
            print(f"Connection to RabbitMQ failed. Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)

# 1. Kết nối tới RabbitMQ một cách kiên nhẫn
connection = connect_to_rabbitmq()
channel = connection.channel()

# 2. Khai báo queue
channel.queue_declare(queue='grading_queue', durable=True)
print(' [*] Waiting for tasks. To exit press CTRL+C')

# 3. Định nghĩa hàm callback
def callback(ch, method, properties, body):
    # ... (phần code callback của bạn giữ nguyên)
    print(f" [x] Received task raw data: {body.decode()}")
    try:
        task_data = json.loads(body.decode())
        submission_id = task_data.get('submission_id')
        if submission_id:
            grade_submission(submission_id)
            ch.basic_ack(delivery_tag=method.delivery_tag)
        else:
            ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        print(f" [!] An error occurred: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag)


# 4. Thiết lập Fair Dispatch
channel.basic_qos(prefetch_count=1)

# 5. Đăng ký callback
channel.basic_consume(queue='grading_queue', on_message_callback=callback)

# 6. Bắt đầu lắng nghe
channel.start_consuming()