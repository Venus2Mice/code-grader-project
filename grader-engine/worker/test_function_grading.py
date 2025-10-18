"""
Unit tests cho function-based grading modules
Test parser, test harness generator, và integration
"""

import sys
import os

# Add worker directory to path
sys.path.insert(0, os.path.dirname(__file__))

from function_parser import FunctionSignatureParser
from test_harness_generator import TestHarnessGenerator


def test_function_parser():
    """Test FunctionSignatureParser"""
    print("=" * 60)
    print("Testing FunctionSignatureParser")
    print("=" * 60)
    
    test_cases = [
        {
            "signature": "int add(int a, int b)",
            "expected": {
                "return_type": "int",
                "function_name": "add",
                "parameters": [("int", "a"), ("int", "b")]
            }
        },
        {
            "signature": "vector<int> twoSum(vector<int>& nums, int target)",
            "expected": {
                "return_type": "vector<int>",
                "function_name": "twoSum",
                "parameters": [("vector<int>&", "nums"), ("int", "target")]
            }
        },
        {
            "signature": "string longestPalindrome(string s)",
            "expected": {
                "return_type": "string",
                "function_name": "longestPalindrome",
                "parameters": [("string", "s")]
            }
        },
        {
            "signature": "vector<vector<int>> threeSum(vector<int>& nums)",
            "expected": {
                "return_type": "vector<vector<int>>",
                "function_name": "threeSum",
                "parameters": [("vector<int>&", "nums")]
            }
        },
        {
            "signature": "bool isPalindrome(string s)",
            "expected": {
                "return_type": "bool",
                "function_name": "isPalindrome",
                "parameters": [("string", "s")]
            }
        },
    ]
    
    parser = FunctionSignatureParser()
    passed = 0
    failed = 0
    
    for i, tc in enumerate(test_cases, 1):
        print(f"\nTest {i}: {tc['signature']}")
        result = parser.parse(tc['signature'])
        
        if result is None:
            print(f"  ❌ Failed to parse")
            failed += 1
            continue
        
        expected = tc['expected']
        if (result['return_type'] == expected['return_type'] and
            result['function_name'] == expected['function_name'] and
            result['parameters'] == expected['parameters']):
            print(f"  ✅ Passed")
            passed += 1
        else:
            print(f"  ❌ Failed")
            print(f"     Expected: {expected}")
            print(f"     Got: {result}")
            failed += 1
    
    print(f"\n{'=' * 60}")
    print(f"Parser Tests: {passed} passed, {failed} failed")
    print(f"{'=' * 60}\n")
    
    return failed == 0


def test_test_harness_generator():
    """Test TestHarnessGenerator"""
    print("=" * 60)
    print("Testing TestHarnessGenerator")
    print("=" * 60)
    
    # Test case 1: Simple int function
    sig1 = "int add(int a, int b)"
    parsed1 = FunctionSignatureParser.parse(sig1)
    student_code1 = """
int add(int a, int b) {
    return a + b;
}
"""
    
    print("\nTest 1: Simple int function")
    harness1 = TestHarnessGenerator.generate(parsed1, student_code1)
    
    # Check if harness contains expected parts
    checks = [
        ("#include <iostream>" in harness1, "Has iostream header"),
        ("int main()" in harness1, "Has main function"),
        ("int a; cin >> a;" in harness1, "Parses int parameter a"),
        ("int b; cin >> b;" in harness1, "Parses int parameter b"),
        ("int result = add(a, b);" in harness1, "Calls function"),
        ("cout << result << endl;" in harness1, "Prints result"),
        (student_code1.strip() in harness1, "Contains student code"),
    ]
    
    passed = 0
    failed = 0
    for check, desc in checks:
        if check:
            print(f"  ✅ {desc}")
            passed += 1
        else:
            print(f"  ❌ {desc}")
            failed += 1
    
    # Test case 2: Vector function
    sig2 = "vector<int> twoSum(vector<int>& nums, int target)"
    parsed2 = FunctionSignatureParser.parse(sig2)
    student_code2 = """
vector<int> twoSum(vector<int>& nums, int target) {
    vector<int> result;
    return result;
}
"""
    
    print("\nTest 2: Vector function")
    harness2 = TestHarnessGenerator.generate(parsed2, student_code2)
    
    checks2 = [
        ("#include <vector>" in harness2, "Has vector header"),
        ("int nums_size;" in harness2, "Parses vector size"),
        ("vector<int> nums(nums_size);" in harness2, "Creates vector"),
        ("int target; cin >> target;" in harness2, "Parses int parameter"),
        ("vector<int> result = twoSum(nums, target);" in harness2, "Calls function with correct types"),
        ("for (size_t i = 0; i < result.size(); i++)" in harness2, "Prints vector result"),
    ]
    
    for check, desc in checks2:
        if check:
            print(f"  ✅ {desc}")
            passed += 1
        else:
            print(f"  ❌ {desc}")
            failed += 1
    
    print(f"\n{'=' * 60}")
    print(f"Generator Tests: {passed} passed, {failed} failed")
    print(f"{'=' * 60}\n")
    
    return failed == 0


def test_input_formatting():
    """Test input data formatting"""
    print("=" * 60)
    print("Testing Input Formatting")
    print("=" * 60)
    
    sig = "vector<int> twoSum(vector<int>& nums, int target)"
    parsed = FunctionSignatureParser.parse(sig)
    
    input_values = [[2, 7, 11, 15], 9]
    formatted = TestHarnessGenerator.format_input_data(parsed, input_values)
    
    expected_lines = ["4", "2", "7", "11", "15", "9"]
    actual_lines = formatted.strip().split('\n')
    
    print(f"\nInput values: {input_values}")
    print(f"Expected format:\n{chr(10).join(expected_lines)}")
    print(f"\nActual format:\n{formatted}")
    
    if actual_lines == expected_lines:
        print("\n✅ Input formatting correct")
        return True
    else:
        print("\n❌ Input formatting incorrect")
        return False


def run_all_tests():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("RUNNING ALL FUNCTION-BASED GRADING TESTS")
    print("=" * 60 + "\n")
    
    results = []
    
    results.append(("Parser", test_function_parser()))
    results.append(("Generator", test_test_harness_generator()))
    results.append(("Input Formatting", test_input_formatting()))
    
    print("\n" + "=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)
    
    for name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{name}: {status}")
    
    all_passed = all(passed for _, passed in results)
    
    print("=" * 60)
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
    else:
        print("⚠️  SOME TESTS FAILED")
    print("=" * 60 + "\n")
    
    return all_passed


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
