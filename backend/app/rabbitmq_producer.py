import pika
import json
import os

# Lấy thông tin RabbitMQ từ biến môi trường (an toàn hơn)
RABBITMQ_HOST = os.environ.get('RABBITMQ_HOST', 'localhost')

def publish_task(task_data):
    """Gửi một task chấm điểm vào hàng đợi."""
    try:
        connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
        channel = connection.channel()
        
        channel.queue_declare(queue='grading_queue', durable=True)
        
        # Ensure all required fields are present
        if 'retry_count' not in task_data:
            task_data['retry_count'] = 0
        if 'is_test' not in task_data:
            task_data['is_test'] = False
        
        message_body = json.dumps(task_data)
        
        channel.basic_publish(
            exchange='',
            routing_key='grading_queue',
            body=message_body,
            properties=pika.BasicProperties(
                delivery_mode=2,  # make message persistent
            )
        )
        print(f" [x] Sent task to RabbitMQ: {message_body}")
        connection.close()
    except pika.exceptions.AMQPConnectionError as e:
        print(f"Error: Could not connect to RabbitMQ at {RABBITMQ_HOST}. Task not sent.")
        # Xử lý lỗi (ví dụ: log lại, thử lại sau, ...)
        # Trong trường hợp này, chúng ta chỉ in ra lỗi.
        # Để hệ thống tin cậy hơn, bạn có thể implement cơ chế retry.