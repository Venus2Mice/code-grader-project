import pika
import json
import time
import docker # Giả sử hàm grade_submission ở đây
import os

# --- Giả lập lại hàm chấm bài từ bước trước ---
# Trong thực tế, bạn sẽ import nó từ một file khác
def grade_submission(submission_id):
    print(f"--- Received submission {submission_id}. Starting grading process. ---")
    
    # Giả lập công việc chấm bài tốn thời gian
    time.sleep(5) 
    
    # Giả sử sau khi chấm xong, chúng ta có kết quả
    result = {'status': 'Accepted', 'execution_time': 120}
    print(f"--- Finished grading {submission_id}. Result: {result['status']} ---")
    
    # Bước tiếp theo: Gọi API của Backend để cập nhật kết quả này.
    # (Hiện tại chúng ta chỉ in ra)
    return True


# --- Phần chính: Lắng nghe RabbitMQ ---

# 1. Kết nối tới RabbitMQ
connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

# 2. Khai báo queue, phải giống hệt bên gửi
channel.queue_declare(queue='grading_queue', durable=True)
print(' [*] Waiting for tasks. To exit press CTRL+C')

# 3. Định nghĩa hàm callback sẽ được gọi khi có tin nhắn
def callback(ch, method, properties, body):
    print(f" [x] Received task raw data: {body.decode()}")
    
    try:
        # Giải mã JSON để lấy submission_id
        task_data = json.loads(body.decode())
        submission_id = task_data.get('submission_id')
        
        if submission_id:
            # Gọi hàm chấm bài chính
            success = grade_submission(submission_id)
            
            if success:
                # Nếu xử lý thành công, gửi một tín hiệu "ack" (acknowledgment)
                # cho RabbitMQ để nó xóa tin nhắn khỏi hàng đợi.
                print(f" [x] Task for submission {submission_id} done. Sending ack.")
                ch.basic_ack(delivery_tag=method.delivery_tag)
            else:
                # Nếu xử lý lỗi, gửi "nack" để RabbitMQ có thể gửi lại task này
                # cho một worker khác (hoặc chính worker này sau này).
                print(f" [!] Task for submission {submission_id} failed. Sending nack.")
                ch.basic_nack(delivery_tag=method.delivery_tag)
        else:
            print(" [!] Invalid task data, no submission_id. Discarding message.")
            ch.basic_ack(delivery_tag=method.delivery_tag) # Vẫn ack để xóa task lỗi
            
    except json.JSONDecodeError:
        print(" [!] Could not decode JSON. Discarding message.")
        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        print(f" [!] An error occurred: {e}")
        # Cân nhắc gửi nack ở đây
        ch.basic_nack(delivery_tag=method.delivery_tag)

# 4. Thiết lập cơ chế "Fair Dispatch"
# Dòng này bảo RabbitMQ đừng gửi tin nhắn mới cho worker này
# cho đến khi nó xử lý xong và gửi ack cho tin nhắn hiện tại.
# Điều này đảm bảo nếu có nhiều worker, task sẽ được phân phối đều.
channel.basic_qos(prefetch_count=1)

# 5. Đăng ký hàm callback với queue 'grading_queue'
channel.basic_consume(queue='grading_queue', on_message_callback=callback)

# 6. Bắt đầu lắng nghe
# Lệnh này sẽ chạy một vòng lặp vô tận, đợi tin nhắn và gọi callback.
# Nó sẽ không thoát ra cho đến khi bạn nhấn CTRL+C.
channel.start_consuming()
