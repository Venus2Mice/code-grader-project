from flask import Blueprint, jsonify
from datetime import datetime
from ..models import db
from ..rabbitmq_pool import get_pool
from sqlalchemy import text
import os
import pika

bp = Blueprint('api', __name__, url_prefix='/api')

@bp.route('/health', methods=['GET'])
def health_check():
    """
    Enhanced health check endpoint with detailed system status
    Returns: Database status, RabbitMQ connectivity, and system info
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": os.getenv("FLASK_ENV", "production")
    }
    
    # Check database connection
    try:
        db.session.execute(text("SELECT 1"))
        health_status["database"] = "connected"
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["database"] = f"error: {str(e)}"
    
    # Check RabbitMQ connectivity
    try:
        pool = get_pool()
        conn = pool.get_connection(timeout=2)
        
        # Test connection by opening a channel
        channel = conn.channel()
        channel.close()
        
        # Return connection to pool
        pool.return_connection(conn)
        
        health_status["rabbitmq"] = "connected"
        health_status["rabbitmq_pool_size"] = pool.pool.qsize()
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["rabbitmq"] = f"error: {str(e)}"
    
    status_code = 200 if health_status["status"] == "healthy" else 503
    return jsonify(health_status), status_code
