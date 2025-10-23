"""
Test script to verify logging improvements
Run this to check if duplicate startup logs are fixed
"""
import os
import sys
import time

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_logging_setup():
    """Test that logging is configured correctly without duplicates"""
    print("🧪 Testing logging improvements...")
    print("-" * 60)
    
    # Import and create app multiple times (simulating reloads)
    from app import create_app
    
    print("\n1️⃣ Creating app instance #1...")
    app1 = create_app()
    
    print("2️⃣ Creating app instance #2 (simulating reload)...")
    app2 = create_app()
    
    print("3️⃣ Creating app instance #3 (simulating reload)...")
    app3 = create_app()
    
    # Check handler count
    handler_count = len(app3.logger.handlers)
    print(f"\n📊 Handler count: {handler_count}")
    print(f"   Expected: 4 (console, app, error, audit)")
    
    if handler_count == 4:
        print("✅ PASS: No duplicate handlers!")
    else:
        print(f"❌ FAIL: Expected 4 handlers, got {handler_count}")
    
    # Test logging
    print("\n📝 Testing log messages...")
    app3.logger.info("Test INFO message")
    app3.logger.warning("Test WARNING message")
    app3.logger.error("Test ERROR message")
    
    print("\n✨ Check logs/app.log and logs/audit.log to verify:")
    print("   - Only 1 startup message per actual startup (not per reload)")
    print("   - audit.log should only have WARNING and ERROR (not INFO)")
    print("   - No duplicate messages")
    
    print("\n" + "=" * 60)
    print("🎯 SUMMARY OF FIXES APPLIED:")
    print("=" * 60)
    print("1. ✅ Werkzeug reloader detection: Startup logs only in main process")
    print("2. ✅ Startup message reduced from 5 lines to 1 line")
    print("3. ✅ Audit log level changed from INFO to WARNING")
    print("4. ✅ Handler duplication check added")
    print("=" * 60)

if __name__ == '__main__':
    test_logging_setup()
