#!/usr/bin/env python3
"""
Test script to verify exit code capture fix for stdio mode grading.

This script tests that runtime errors (division by zero, segfault, etc.)
are properly detected and reported as "Runtime Error" instead of "Wrong Answer".
"""

import subprocess
import tempfile
import os

def test_exit_code_capture():
    """Test that bash script properly captures program exit code"""
    
    # Test 1: Division by zero (should exit with 136 = SIGFPE)
    print("Test 1: Division by zero")
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create division by zero program
        cpp_file = os.path.join(tmpdir, "test.cpp")
        with open(cpp_file, "w") as f:
            f.write("""
#include <iostream>
using namespace std;
int main() {
    int a = 10, b = 0;
    cout << a / b << endl;
    return 0;
}
""")
        
        # Compile
        subprocess.run(["g++", "-o", os.path.join(tmpdir, "test"), cpp_file], check=True)
        
        # Create wrapper script (same as in grader.py)
        wrapper_script = f"""#!/bin/bash
/usr/bin/time -v -o {tmpdir}/time_output.txt timeout 1.0 {tmpdir}/test > {tmpdir}/output.txt 2> {tmpdir}/program_stderr.txt
PROGRAM_EXIT=$?
echo $PROGRAM_EXIT > {tmpdir}/exitcode.txt
exit $PROGRAM_EXIT
"""
        script_file = os.path.join(tmpdir, "run_wrapper.sh")
        with open(script_file, "w") as f:
            f.write(wrapper_script)
        os.chmod(script_file, 0o755)
        
        # Run wrapper
        result = subprocess.run(["/bin/bash", script_file], cwd=tmpdir)
        
        # Read exit code
        with open(os.path.join(tmpdir, "exitcode.txt")) as f:
            exit_code = int(f.read().strip())
        
        print(f"  Exit code: {exit_code} (expected: 136 for SIGFPE)")
        
        # Read stderr
        with open(os.path.join(tmpdir, "program_stderr.txt")) as f:
            stderr = f.read()
        print(f"  Stderr: {stderr[:200] if stderr else '(empty)'}")
        
        # Verify
        if exit_code == 136:
            print("  ✅ PASS: Exit code correctly captured as 136 (SIGFPE)")
        else:
            print(f"  ❌ FAIL: Exit code is {exit_code}, expected 136")
            
    print()
    
    # Test 2: Segmentation fault (should exit with 139 = SIGSEGV)
    print("Test 2: Segmentation fault")
    with tempfile.TemporaryDirectory() as tmpdir:
        cpp_file = os.path.join(tmpdir, "test.cpp")
        with open(cpp_file, "w") as f:
            f.write("""
#include <iostream>
using namespace std;
int main() {
    int* ptr = nullptr;
    cout << *ptr << endl;
    return 0;
}
""")
        
        subprocess.run(["g++", "-o", os.path.join(tmpdir, "test"), cpp_file], check=True)
        
        wrapper_script = f"""#!/bin/bash
/usr/bin/time -v -o {tmpdir}/time_output.txt timeout 1.0 {tmpdir}/test > {tmpdir}/output.txt 2> {tmpdir}/program_stderr.txt
PROGRAM_EXIT=$?
echo $PROGRAM_EXIT > {tmpdir}/exitcode.txt
exit $PROGRAM_EXIT
"""
        script_file = os.path.join(tmpdir, "run_wrapper.sh")
        with open(script_file, "w") as f:
            f.write(wrapper_script)
        os.chmod(script_file, 0o755)
        
        result = subprocess.run(["/bin/bash", script_file], cwd=tmpdir)
        
        with open(os.path.join(tmpdir, "exitcode.txt")) as f:
            exit_code = int(f.read().strip())
        
        print(f"  Exit code: {exit_code} (expected: 139 for SIGSEGV)")
        
        with open(os.path.join(tmpdir, "program_stderr.txt")) as f:
            stderr = f.read()
        print(f"  Stderr: {stderr[:200] if stderr else '(empty)'}")
        
        if exit_code == 139:
            print("  ✅ PASS: Exit code correctly captured as 139 (SIGSEGV)")
        else:
            print(f"  ❌ FAIL: Exit code is {exit_code}, expected 139")
            
    print()
    
    # Test 3: Normal program with output (should exit with 0)
    print("Test 3: Normal program (no error)")
    with tempfile.TemporaryDirectory() as tmpdir:
        cpp_file = os.path.join(tmpdir, "test.cpp")
        with open(cpp_file, "w") as f:
            f.write("""
#include <iostream>
using namespace std;
int main() {
    int a = 10, b = 2;
    cout << a / b << endl;
    return 0;
}
""")
        
        subprocess.run(["g++", "-o", os.path.join(tmpdir, "test"), cpp_file], check=True)
        
        wrapper_script = f"""#!/bin/bash
/usr/bin/time -v -o {tmpdir}/time_output.txt timeout 1.0 {tmpdir}/test > {tmpdir}/output.txt 2> {tmpdir}/program_stderr.txt
PROGRAM_EXIT=$?
echo $PROGRAM_EXIT > {tmpdir}/exitcode.txt
exit $PROGRAM_EXIT
"""
        script_file = os.path.join(tmpdir, "run_wrapper.sh")
        with open(script_file, "w") as f:
            f.write(wrapper_script)
        os.chmod(script_file, 0o755)
        
        result = subprocess.run(["/bin/bash", script_file], cwd=tmpdir)
        
        with open(os.path.join(tmpdir, "exitcode.txt")) as f:
            exit_code = int(f.read().strip())
        
        with open(os.path.join(tmpdir, "output.txt")) as f:
            output = f.read().strip()
        
        print(f"  Exit code: {exit_code} (expected: 0)")
        print(f"  Output: '{output}' (expected: '5')")
        
        if exit_code == 0 and output == "5":
            print("  ✅ PASS: Normal program runs correctly")
        else:
            print(f"  ❌ FAIL: Exit code={exit_code}, output='{output}'")

if __name__ == "__main__":
    print("=" * 60)
    print("Testing Exit Code Capture Fix")
    print("=" * 60)
    print()
    
    try:
        test_exit_code_capture()
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
    
    print()
    print("=" * 60)
    print("Test Complete")
    print("=" * 60)
