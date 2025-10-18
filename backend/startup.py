"""
Startup script for Backend - Auto-initialize database on first run
Handles: PostgreSQL connection wait, migrations, and data seeding
"""
import subprocess
import time
import sys
import os

def wait_for_postgres(max_retries=60):
    """
    Wait for PostgreSQL to be ready
    """
    print("⏳ Waiting for PostgreSQL to be ready...")
    
    # Get credentials from environment or use defaults
    pg_user = os.getenv("POSTGRES_USER", "user")
    pg_password = os.getenv("POSTGRES_PASSWORD", "password123")
    pg_db = os.getenv("POSTGRES_DB", "code_grader_db")
    
    for attempt in range(max_retries):
        try:
            import socket
            # Try TCP connection first (faster than psycopg2)
            sock = socket.create_connection(("postgres", 5432), timeout=2)
            sock.close()
            
            # Now try PostgreSQL connection
            import psycopg2
            conn = psycopg2.connect(
                host="postgres",
                port=5432,
                database=pg_db,
                user=pg_user,
                password=pg_password,
                connect_timeout=5
            )
            conn.close()
            print("✅ PostgreSQL is ready!")
            return True
        except Exception as e:
            remaining = max_retries - attempt - 1
            if attempt % 15 == 0:  # Log mỗi 15 attempts
                print(f"   Still waiting for PostgreSQL... ({remaining} attempts left)")
            time.sleep(1)
    
    print("❌ PostgreSQL failed to start after 60 attempts!")
    return False

def run_migrations():
    """
    Run database migrations
    First tries 'flask db upgrade', if fails then 'flask db init && flask db upgrade'
    """
    print("\n🔄 Running database migrations...")
    
    # Try upgrade first
    result = subprocess.run(
        "flask db upgrade",
        shell=True,
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print("✅ Database upgrade completed!")
        return True
    
    # If upgrade fails, init first then upgrade
    print("   Database not initialized, creating new migration...")
    subprocess.run("flask db init", shell=True, capture_output=True)
    
    result = subprocess.run(
        "flask db upgrade",
        shell=True,
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print("✅ Database initialized and upgraded!")
        return True
    else:
        print("❌ Database migration failed!")
        print(result.stderr)
        return False

def seed_database():
    """
    Seed database with initial data
    """
    print("\n🌱 Seeding database with initial data...")
    
    # Seed roles and basic data
    result1 = subprocess.run(
        "flask seed_db",
        shell=True,
        capture_output=True,
        text=True
    )
    
    # Seed test data
    result2 = subprocess.run(
        "flask seed_test_data",
        shell=True,
        capture_output=True,
        text=True
    )
    
    if result1.returncode == 0 and result2.returncode == 0:
        print("✅ Database seeded successfully!")
        print("   Teacher: teacher.test@example.com / password123")
        print("   Student: student.test@example.com / password123")
        return True
    else:
        print("⚠️  Seeding completed with some warnings")
        if result1.returncode != 0:
            print(result1.stdout)
        if result2.returncode != 0:
            print(result2.stdout)
        return True  # Don't fail if seeding has issues

def start_flask_app():
    """
    Start Flask application
    """
    print("\n🚀 Starting Flask application...\n")
    os.execvp("python", ["python", "-m", "flask", "run", "--host=0.0.0.0"])

def main():
    """
    Main startup sequence
    """
    print("=" * 60)
    print("🔧 Code Grader Backend - Startup Sequence")
    print("=" * 60)
    
    # Step 1: Wait for PostgreSQL
    if not wait_for_postgres():
        sys.exit(1)
    
    # Step 2: Run migrations
    if not run_migrations():
        sys.exit(1)
    
    # Step 3: Seed database
    seed_database()
    
    # Step 4: Start Flask
    start_flask_app()

if __name__ == "__main__":
    main()
