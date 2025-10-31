"""
RabbitMQ Connection Pool Implementation
Provides connection pooling to reduce overhead and improve reliability
"""
import pika
import json
import os
import logging
from threading import Lock
from queue import Queue, Empty
import time

logger = logging.getLogger(__name__)

RABBITMQ_HOST = os.environ.get('RABBITMQ_HOST', 'localhost')
RABBITMQ_PORT = int(os.environ.get('RABBITMQ_PORT', '5672'))
RABBITMQ_USER = os.environ.get('RABBITMQ_USER', 'guest')
RABBITMQ_PASSWORD = os.environ.get('RABBITMQ_PASSWORD', 'guest')


class RabbitMQConnectionPool:
    """
    Thread-safe RabbitMQ connection pool
    Maintains a pool of reusable connections to reduce connection overhead
    """
    
    def __init__(self, pool_size=5, max_retries=3, retry_delay=2):
        """
        Initialize connection pool
        
        Args:
            pool_size: Number of connections to maintain in the pool
            max_retries: Maximum number of connection retry attempts
            retry_delay: Delay between retries in seconds
        """
        self.pool_size = pool_size
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.pool = Queue(maxsize=pool_size)
        self.lock = Lock()
        self._initialize_pool()
    
    def _create_connection(self):
        """Create a new RabbitMQ connection with retry logic"""
        credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD)
        parameters = pika.ConnectionParameters(
            host=RABBITMQ_HOST,
            port=RABBITMQ_PORT,
            credentials=credentials,
            heartbeat=600,
            blocked_connection_timeout=300
        )
        
        for attempt in range(self.max_retries):
            try:
                connection = pika.BlockingConnection(parameters)
                logger.info(f"✅ Created RabbitMQ connection (attempt {attempt + 1})")
                return connection
            except pika.exceptions.AMQPConnectionError as e:
                if attempt < self.max_retries - 1:
                    logger.warning(f"⚠️  RabbitMQ connection failed (attempt {attempt + 1}): {e}")
                    time.sleep(self.retry_delay * (2 ** attempt))  # Exponential backoff
                else:
                    logger.error(f"❌ Failed to connect to RabbitMQ after {self.max_retries} attempts")
                    raise
    
    def _initialize_pool(self):
        """Pre-create connections for the pool"""
        with self.lock:
            for i in range(self.pool_size):
                try:
                    conn = self._create_connection()
                    self.pool.put(conn)
                    logger.info(f"Added connection {i + 1}/{self.pool_size} to pool")
                except Exception as e:
                    logger.error(f"Failed to initialize connection {i + 1}: {e}")
    
    def get_connection(self, timeout=5):
        """
        Get a connection from the pool
        
        Args:
            timeout: Maximum time to wait for an available connection
            
        Returns:
            RabbitMQ connection
            
        Raises:
            Empty: If no connection is available within timeout
        """
        try:
            conn = self.pool.get(timeout=timeout)
            
            # Check if connection is still open
            if conn.is_closed:
                logger.warning("⚠️  Retrieved closed connection, creating new one")
                conn = self._create_connection()
            
            return conn
        except Empty:
            logger.warning("⚠️  Pool exhausted, creating temporary connection")
            return self._create_connection()
    
    def return_connection(self, conn):
        """
        Return a connection to the pool
        
        Args:
            conn: Connection to return
        """
        if conn and not conn.is_closed:
            try:
                self.pool.put_nowait(conn)
            except:
                # Pool is full, close the connection
                conn.close()
        elif conn:
            conn.close()
    
    def close_all(self):
        """Close all connections in the pool"""
        with self.lock:
            while not self.pool.empty():
                try:
                    conn = self.pool.get_nowait()
                    if not conn.is_closed:
                        conn.close()
                except Empty:
                    break
            logger.info("✅ All RabbitMQ connections closed")


# Global connection pool instance
_connection_pool = None
_pool_lock = Lock()


def get_pool():
    """Get or create the global connection pool"""
    global _connection_pool
    if _connection_pool is None:
        with _pool_lock:
            if _connection_pool is None:
                _connection_pool = RabbitMQConnectionPool(pool_size=5)
    return _connection_pool


def publish_task_with_pool(task_data, queue_name='grading_queue', max_retries=3):
    """
    Publish a task using the connection pool
    
    Args:
        task_data: Task data to publish (dict)
        queue_name: Name of the queue
        max_retries: Maximum number of publish retry attempts
        
    Returns:
        bool: True if published successfully, False otherwise
    """
    pool = get_pool()
    conn = None
    
    for attempt in range(max_retries):
        try:
            conn = pool.get_connection()
            channel = conn.channel()
            
            # Declare queue (idempotent)
            channel.queue_declare(queue=queue_name, durable=True)
            
            # Publish message
            message_body = json.dumps(task_data)
            channel.basic_publish(
                exchange='',
                routing_key=queue_name,
                body=message_body,
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Persistent message
                    content_type='application/json'
                )
            )
            
            logger.info(f"✅ Published task to {queue_name}: {message_body}")
            pool.return_connection(conn)
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to publish task (attempt {attempt + 1}): {e}")
            if conn:
                try:
                    conn.close()
                except:
                    pass
            
            if attempt < max_retries - 1:
                time.sleep(pool.retry_delay * (2 ** attempt))
            else:
                logger.error(f"❌ Failed to publish task after {max_retries} attempts")
                return False
    
    return False


def close_pool():
    """Close the global connection pool"""
    global _connection_pool
    if _connection_pool:
        _connection_pool.close_all()
        _connection_pool = None
