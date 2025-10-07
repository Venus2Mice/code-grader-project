import pika
import json

# Kết nối tới RabbitMQ server
connection = pika.BlockingConnection(pika.ConnectionParameters('rabbitmq'))
channel = connection.channel()

# Khai báo một hàng đợi (queue) tên là 'grading_queue'
# durable=True: đảm bảo queue không bị mất khi RabbitMQ khởi động lại
channel.queue_declare(queue='grading_queue', durable=True)

# Dữ liệu task cần gửi (ví dụ cho submission_id = 123)
task_data = {'submission_id': 123}

# Gửi tin nhắn
# exchange='': sử dụng exchange mặc định
# routing_key='grading_queue': gửi tin nhắn đến queue có tên này
# body: nội dung tin nhắn, phải là dạng bytes
# properties: đánh dấu tin nhắn là persistent
channel.basic_publish(
    exchange='',
    routing_key='grading_queue',
    body=json.dumps(task_data),
    properties=pika.BasicProperties(
        delivery_mode=2,  # make message persistent
    )
)

print(f" [x] Sent task: {task_data}")

# Đóng kết nối
connection.close()
