import pika
import json
import os
import logging

logger = logging.getLogger(__name__)

# Get RabbitMQ info from environment variables
RABBITMQ_HOST = os.environ.get('RABBITMQ_HOST', 'localhost')

def publish_task(task_data):
    """Send a grading task to the queue."""
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
        logger.info(f"Sent task to RabbitMQ: {message_body}")
        connection.close()
    except pika.exceptions.AMQPConnectionError as e:
        logger.error(f"Could not connect to RabbitMQ at {RABBITMQ_HOST}. Task not sent: {e}")
        # For better reliability, implement retry mechanism