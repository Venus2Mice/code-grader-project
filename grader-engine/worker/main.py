# /grader-engine/worker/main.py
import pika
import json
import requests
from .config import Config
from .grader import grade_submission
from .container_pool import initialize_container_pool, shutdown_container_pool
import time
import threading
from queue import Queue

# ✅ OPTIMIZED: Queue for async backend updates (Fire and forget pattern)
backend_update_queue = Queue(maxsize=100)

def backend_update_worker():
    """Worker thread để async update backend results"""
    while True:
        try:
            submission_id, result_data = backend_update_queue.get(timeout=1)
            update_backend_sync(submission_id, result_data)
            backend_update_queue.task_done()
        except:
            continue

def update_backend_sync(submission_id, result_data, retries=3):
    """Gửi kết quả chấm bài về cho Backend API (with retry logic)."""
    url = f"{Config.BACKEND_API_URL}/internal/submissions/{submission_id}/result"
    
    for attempt in range(retries):
        try:
            response = requests.post(url, json=result_data, timeout=10)
            response.raise_for_status()
            print(f"Successfully updated backend for submission {submission_id}")
            return True
        except requests.exceptions.RequestException as e:
            if attempt < retries - 1:
                wait_time = (2 ** attempt)  # Exponential backoff: 1s, 2s, 4s
                print(f"Error updating backend for submission {submission_id}: {e}. Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                print(f"Failed to update backend after {retries} attempts: {e}")
                return False
    
    return False

def update_backend_async(submission_id, result_data):
    """✅ OPTIMIZED: Async backend update (offloads 200-500ms from main grading flow)"""
    try:
        backend_update_queue.put_nowait((submission_id, result_data))
        print(f"Queued async backend update for submission {submission_id}")
    except Exception as e:
        print(f"Error queueing backend update: {e}")
        # Fallback to sync if queue is full
        backend_update_queue.get()  # Remove oldest
        backend_update_queue.put_nowait((submission_id, result_data))

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
                # ✅ OPTIMIZED: Async backend update instead of blocking
                update_backend_async(submission_id, result)
            
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
    """Hàm chính khởi động worker với cơ chế retry và container pool."""
    print("Starting worker...")
    
    # ✅ OPTIMIZED: Initialize container pool
    print("Initializing container pool...")
    try:
        container_pool = initialize_container_pool(pool_size=3)
        print("Container pool initialized successfully")
    except Exception as e:
        print(f"Warning: Failed to initialize container pool: {e}")
    
    # ✅ OPTIMIZED: Start backend update worker thread
    update_worker_thread = threading.Thread(target=backend_update_worker, daemon=True)
    update_worker_thread.start()
    print("Backend update worker thread started")
    
    connection = None
    retry_interval = 5
    max_retries = 10
    
    for i in range(max_retries):
        try:
            print(f"Connecting to RabbitMQ at {Config.RABBITMQ_HOST}... (Attempt {i+1}/{max_retries})")
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(host=Config.RABBITMQ_HOST)
            )
            print("Successfully connected to RabbitMQ.")
            break
        except pika.exceptions.AMQPConnectionError:
            print(f"Connection failed. Retrying in {retry_interval} seconds...")
            time.sleep(retry_interval)
    
    if not connection:
        print("Could not connect to RabbitMQ after several attempts. Exiting.")
        shutdown_container_pool()
        return
    
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
        print("Shutting down...")
        if connection.is_open:
            connection.close()
            print("RabbitMQ connection closed.")
        
        # ✅ Cleanup container pool
        shutdown_container_pool()
        print("Container pool shut down.")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('Interrupted')