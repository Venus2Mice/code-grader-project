# Testing Function-Based Grading

## 🧪 Chạy Unit Tests

```bash
cd grader-engine/worker
python test_function_grading.py
```

## 📋 Test Coverage

- ✅ Function signature parser (5 test cases)
- ✅ Test harness generator (2 test cases)  
- ✅ Input formatting

## 🔧 Test Từng Module Riêng Lẻ

### Test Parser
```bash
python function_parser.py
```

**Test cases:**
- `int add(int a, int b)`
- `vector<int> twoSum(vector<int>& nums, int target)`
- `vector<vector<int>> threeSum(vector<int>& nums)`
- Và nhiều hơn...

### Test Generator
```bash
python test_harness_generator.py
```

**Output:** Test harness code cho các function types khác nhau

## 📝 Format Test Cases Cho Function-Based

### Primitive Types
```
Input:  5
        3
Output: 8
```

### Vector Types  
```
Input:  4       ← size
        2       ← elements
        7
        11
        15
Output: 0 1     ← space-separated
```

### Multiple Parameters
```
// vector<int> findKth(vector<int>& arr, int k)
Input:  3       ← vector size
        5       ← elements
        2
        8
        2       ← k value
```

## ✅ Expected Test Results

Khi chạy `python test_function_grading.py`, bạn sẽ thấy:

```
============================================================
RUNNING ALL FUNCTION-BASED GRADING TESTS
============================================================

============================================================
Testing FunctionSignatureParser
============================================================

Test 1: int add(int a, int b)
  ✅ Passed

Test 2: vector<int> twoSum(vector<int>& nums, int target)
  ✅ Passed

...

============================================================
Parser Tests: 5 passed, 0 failed
============================================================

============================================================
Testing TestHarnessGenerator
============================================================

Test 1: Simple int function
  ✅ Has iostream header
  ✅ Has main function
  ✅ Parses int parameter a
  ✅ Parses int parameter b
  ✅ Calls function
  ✅ Prints result
  ✅ Contains student code

Test 2: Vector function
  ✅ Has vector header
  ✅ Parses vector size
  ✅ Creates vector
  ✅ Parses int parameter
  ✅ Calls function with correct types
  ✅ Prints vector result

============================================================
Generator Tests: 13 passed, 0 failed
============================================================

============================================================
Testing Input Formatting
============================================================

Input values: [[2, 7, 11, 15], 9]
Expected format:
4
2
7
11
15
9

Actual format:
4
2
7
11
15
9

✅ Input formatting correct

============================================================
FINAL RESULTS
============================================================
Parser: ✅ PASSED
Generator: ✅ PASSED
Input Formatting: ✅ PASSED
============================================================
🎉 ALL TESTS PASSED!
============================================================
```

## 🚀 Integration Test (Manual)

1. **Tạo function-based problem trong frontend:**
   - Grading Mode: "Function-based"
   - Function Signature: `int add(int a, int b)`
   - Test case input: `5\n3`
   - Expected output: `8`

2. **Student submit:**
   ```cpp
   int add(int a, int b) {
       return a + b;
   }
   ```

3. **Worker sẽ:**
   - Parse signature ✅
   - Generate test harness ✅
   - Compile ✅
   - Run test case ✅
   - Compare output: `8` == `8` ✅
   - Return: "Accepted" ✅

## 🐛 Troubleshooting

### Test failed to parse signature
- Check syntax trong `function_parser.py`
- Verify test cases format

### Test harness generation error
- Check templates trong `test_harness_generator.py`
- Verify student code format

### Import errors
- Make sure you're in `grader-engine/worker` directory
- Python modules are in same directory

## 📊 Files Structure

```
grader-engine/worker/
├── function_parser.py          # Parser module
├── test_harness_generator.py   # Generator module  
├── grader_function.py          # Grading logic
├── test_function_grading.py    # Unit tests ← RUN THIS
└── grader.py                   # Main grader (updated)
```

---

**All tests should pass!** Nếu có lỗi, check log output để debug.
