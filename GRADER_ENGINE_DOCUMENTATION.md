# 6. Grader Engine (Hệ thống chấm điểm)

## 6.1. Kiến trúc Grader Worker

### 6.1.1. Tổng quan kiến trúc

Grader Engine là thành phần cốt lõi của hệ thống, chịu trách nhiệm thực thi và chấm điểm code của sinh viên một cách tự động, an toàn và hiệu quả.

**Kiến trúc phân tán với Message Queue:**

```
Backend API Server
      ↓ (publish job)
  RabbitMQ Queue
      ↓ (consume job)
  Grader Worker Pool
      ↓ (update result)
  PostgreSQL Database
```

### 6.1.2. RabbitMQ Message Queue

**Vai trò:**
- **Decoupling**: Tách biệt API server và grader worker, tránh blocking requests
- **Load balancing**: Phân phối job đến nhiều workers song song
- **Reliability**: Đảm bảo không mất job nếu worker crash (message acknowledgment)
- **Scalability**: Dễ dàng scale workers theo nhu cầu

**Message Format:**
```json
{
  "submission_id": 123,
  "problem_id": 45,
  "user_id": 67,
  "code": "def add(a, b):\n    return a + b",
  "language": "python",
  "grading_mode": "function",
  "test_cases": [
    {
      "id": 1,
      "input": "1, 2",
      "expected_output": "3",
      "weight": 10
    }
  ],
  "time_limit": 2.0,
  "memory_limit": 256
}
```

### 6.1.3. Worker Pool Architecture

**Đặc điểm:**
- Mỗi worker là một process độc lập chạy trong Docker container
- Workers consume jobs từ queue theo cơ chế **round-robin**
- Hỗ trợ horizontal scaling: thêm workers khi tải cao

**Worker Lifecycle:**
```
1. Connect to RabbitMQ
2. Listen for jobs in queue
3. Receive job → ACK message
4. Execute grading process
5. Update result to database via API
6. Mark message as processed
7. Back to step 2
```

### 6.1.4. Sandboxing & Security

**Isolation Strategy:**
- Mỗi submission chạy trong **subprocess riêng biệt**
- **Timeout mechanism**: Kill process nếu vượt time limit
- **Memory monitoring**: Giới hạn memory usage
- **File system restrictions**: Không cho phép đọc/ghi file bên ngoài sandbox

**Resource Limits:**
```python
# Example configuration
RESOURCE_LIMITS = {
    'time_limit': 5.0,      # seconds
    'memory_limit': 256,    # MB
    'output_limit': 10000,  # bytes
    'file_size_limit': 100  # KB
}
```

---

## 6.2. Hai chế độ chấm điểm

### 6.2.1. STDIO Mode (Input/Output Matching)

**Phù hợp với:** Bài tập yêu cầu đọc input từ stdin, xuất output ra stdout

**Quy trình:**
1. Compile code (nếu là C++/Java)
2. Với mỗi test case:
   - Chạy chương trình với input từ test case
   - Capture output từ stdout
   - So sánh với expected output (exact match hoặc ignore whitespace)
3. Tính điểm dựa trên số test cases passed

**Ví dụ Test Case:**
```yaml
Input: "5\n10\n"
Expected Output: "15\n"
```

**Implementation Flow:**
```python
def grade_stdio(code, test_cases, language):
    executable = compile_code(code, language)
    
    results = []
    for tc in test_cases:
        result = run_with_input(
            executable, 
            tc.input,
            timeout=tc.time_limit
        )
        
        passed = compare_output(
            result.stdout, 
            tc.expected_output
        )
        
        results.append({
            'test_case_id': tc.id,
            'passed': passed,
            'output': result.stdout,
            'error': result.stderr,
            'time': result.execution_time
        })
    
    return calculate_score(results)
```

### 6.2.2. Function Mode (Function Signature Testing)

**Phù hợp với:** Bài tập yêu cầu viết hàm với signature cụ thể

**Quy trình:**
1. **Parse code** để extract function definition
2. **Generate test harness**: Tự động tạo code gọi hàm với test inputs
3. **Execute** test harness và capture kết quả
4. **Compare** output với expected values
5. Tính điểm

**Ví dụ:**

*Yêu cầu đề bài:*
```python
def add(a: int, b: int) -> int:
    """Trả về tổng của a và b"""
    pass
```

*Code sinh viên submit:*
```python
def add(a, b):
    return a + b
```

*Test cases:*
```json
[
  {"input": "[1, 2]", "expected_output": "3"},
  {"input": "[10, -5]", "expected_output": "5"},
  {"input": "[0, 0]", "expected_output": "0"}
]
```

---

## 6.3. Xử lý Test Cases (Core Components)

### 6.3.1. function_parser.py - Phân tích cú pháp code

**Mục đích:** Extract thông tin về hàm từ code sinh viên

**Chức năng chính:**
- Parse code thành Abstract Syntax Tree (AST)
- Tìm function definition khớp với tên hàm yêu cầu
- Trích xuất: tên hàm, tham số, kiểu trả về, docstring
- Validate function signature

**Implementation:**
```python
import ast

def parse_function(code: str, function_name: str):
    """
    Parse Python code và trích xuất thông tin hàm
    
    Returns:
        {
            'name': str,
            'params': List[str],
            'param_types': Dict[str, str],
            'return_type': str,
            'body': str
        }
    """
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        raise ParseError(f"Syntax error: {e}")
    
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            if node.name == function_name:
                return {
                    'name': node.name,
                    'params': [arg.arg for arg in node.args.args],
                    'param_types': extract_annotations(node.args),
                    'return_type': extract_return_type(node),
                    'body': ast.get_source_segment(code, node)
                }
    
    raise FunctionNotFoundError(f"Function '{function_name}' not found")
```

**Error Handling:**
- Syntax errors → trả về lỗi compile
- Function không tồn tại → fail ngay
- Sai signature → cảnh báo nhưng vẫn chạy test

---

### 6.3.2. test_harness_generator.py - Tạo khung kiểm thử

**Mục đích:** Tự động generate code để test hàm của sinh viên

**Quy trình:**
1. Nhận function info từ parser
2. Nhận danh sách test cases
3. Generate code gọi hàm với từng test case
4. Wrap trong try-catch để bắt exceptions
5. Serialize kết quả thành JSON

**Generated Test Harness Example:**

*Input:*
- Function: `add(a, b)`
- Test cases: `[[1, 2], [10, -5]]`

*Output (generated code):*
```python
import json
import sys

# Student's code
def add(a, b):
    return a + b

# Test harness
def run_tests():
    results = []
    
    # Test case 1
    try:
        result = add(1, 2)
        results.append({
            'test_id': 1,
            'passed': result == 3,
            'output': result,
            'error': None
        })
    except Exception as e:
        results.append({
            'test_id': 1,
            'passed': False,
            'output': None,
            'error': str(e)
        })
    
    # Test case 2
    try:
        result = add(10, -5)
        results.append({
            'test_id': 2,
            'passed': result == 5,
            'output': result,
            'error': None
        })
    except Exception as e:
        results.append({
            'test_id': 2,
            'passed': False,
            'output': None,
            'error': str(e)
        })
    
    print(json.dumps(results))

if __name__ == '__main__':
    run_tests()
```

**Implementation:**
```python
def generate_test_harness(function_info, test_cases, student_code):
    """
    Generate executable test code
    """
    template = """
import json
import sys

{student_code}

def run_tests():
    results = []
    {test_blocks}
    print(json.dumps(results))

if __name__ == '__main__':
    run_tests()
"""
    
    test_blocks = []
    for tc in test_cases:
        test_block = f"""
    # Test case {tc.id}
    try:
        args = {tc.input}
        result = {function_info['name']}(*args)
        expected = {tc.expected_output}
        
        results.append({{
            'test_id': {tc.id},
            'passed': result == expected,
            'output': str(result),
            'expected': str(expected),
            'error': None
        }})
    except Exception as e:
        results.append({{
            'test_id': {tc.id},
            'passed': False,
            'output': None,
            'expected': str({tc.expected_output}),
            'error': str(e)
        }})
"""
        test_blocks.append(test_block)
    
    return template.format(
        student_code=student_code,
        test_blocks='\n'.join(test_blocks)
    )
```

---

### 6.3.3. test_function_grading.py - Thực thi tests

**Mục đích:** Chạy test harness và thu thập kết quả

**Quy trình:**
1. Nhận test harness code từ generator
2. Lưu vào file tạm
3. Execute trong subprocess với resource limits
4. Parse JSON output
5. Handle timeouts, errors, crashes
6. Trả về structured results

**Implementation:**
```python
import subprocess
import json
import tempfile
import os
from typing import Dict, List

def execute_test_harness(
    harness_code: str,
    language: str,
    time_limit: float,
    memory_limit: int
) -> List[Dict]:
    """
    Execute test harness và trả về kết quả
    
    Returns:
        List of test results:
        [
            {
                'test_id': int,
                'passed': bool,
                'output': str,
                'expected': str,
                'error': str,
                'execution_time': float
            }
        ]
    """
    
    # Create temp file
    with tempfile.NamedTemporaryFile(
        mode='w', 
        suffix='.py', 
        delete=False
    ) as f:
        f.write(harness_code)
        temp_file = f.name
    
    try:
        # Execute with timeout and resource limits
        result = subprocess.run(
            ['python3', temp_file],
            capture_output=True,
            text=True,
            timeout=time_limit,
            # Resource limits via ulimit or cgroups
        )
        
        # Parse JSON output
        if result.returncode == 0:
            results = json.loads(result.stdout)
            return results
        else:
            # Runtime error
            return [{
                'test_id': 0,
                'passed': False,
                'error': f'Runtime Error: {result.stderr}',
                'output': None,
                'expected': None
            }]
            
    except subprocess.TimeoutExpired:
        return [{
            'test_id': 0,
            'passed': False,
            'error': f'Time Limit Exceeded (>{time_limit}s)',
            'output': None,
            'expected': None
        }]
    except json.JSONDecodeError:
        return [{
            'test_id': 0,
            'passed': False,
            'error': 'Invalid output format',
            'output': result.stdout,
            'expected': None
        }]
    finally:
        # Cleanup temp file
        os.unlink(temp_file)
```

**Error Cases:**
- **Compile Error**: Không compile được → điểm 0
- **Time Limit Exceeded**: Vượt thời gian → fail test case đó
- **Runtime Error**: Exception → fail test case, ghi log error
- **Memory Limit**: Out of memory → kill process
- **Output Error**: Output sai format → fail

---

### 6.3.4. grader_function.py - Tính điểm và tổng hợp kết quả

**Mục đích:** Orchestrate toàn bộ quy trình chấm và tính điểm cuối cùng

**Quy trình:**
```
1. Receive grading job from queue
2. Validate submission (code not empty, language supported)
3. Call function_parser → extract function info
4. Call test_harness_generator → create test code
5. Call test_function_grading → execute tests
6. Calculate final score based on results
7. Update database with:
   - Total score
   - Individual test results
   - Execution logs
   - Grading status
8. Send notification (optional)
```

**Scoring Algorithm:**

**Phương pháp 1: Weighted Average**
```python
def calculate_score(test_results, test_cases):
    """
    Tính điểm dựa trên trọng số của từng test case
    """
    total_weight = sum(tc.weight for tc in test_cases)
    earned_weight = 0
    
    for result, tc in zip(test_results, test_cases):
        if result['passed']:
            earned_weight += tc.weight
    
    return (earned_weight / total_weight) * 100
```

**Phương pháp 2: Partial Credit**
```python
def calculate_score_with_partial(test_results):
    """
    - Compile error: 0 điểm
    - Runtime error: 20% điểm test case
    - Wrong output: 50% điểm test case (nếu gần đúng)
    - Correct: 100% điểm test case
    """
    total_score = 0
    
    for result in test_results:
        if result['error']:
            if 'Timeout' in result['error']:
                total_score += 0  # TLE = 0 points
            else:
                total_score += 0.2  # Runtime error = 20%
        elif result['passed']:
            total_score += 1.0
        else:
            # Wrong output, check similarity
            similarity = calculate_similarity(
                result['output'], 
                result['expected']
            )
            if similarity > 0.8:
                total_score += 0.5  # Close answer = 50%
    
    return (total_score / len(test_results)) * 100
```

**Main Grading Function:**
```python
def grade_submission(job_data: dict) -> dict:
    """
    Main grading orchestration function
    
    Args:
        job_data: {
            'submission_id': int,
            'code': str,
            'language': str,
            'problem': {
                'function_name': str,
                'grading_mode': str
            },
            'test_cases': List[dict]
        }
    
    Returns:
        {
            'submission_id': int,
            'status': str,  # 'completed', 'error', 'timeout'
            'total_score': float,
            'test_results': List[dict],
            'compilation_output': str,
            'error_message': str
        }
    """
    
    submission_id = job_data['submission_id']
    
    try:
        # Step 1: Validate
        validate_submission(job_data)
        
        # Step 2: Parse function (if function mode)
        if job_data['problem']['grading_mode'] == 'function':
            function_info = parse_function(
                job_data['code'],
                job_data['problem']['function_name']
            )
        
            # Step 3: Generate test harness
            test_harness = generate_test_harness(
                function_info,
                job_data['test_cases'],
                job_data['code']
            )
        else:
            # STDIO mode: use code directly
            test_harness = job_data['code']
        
        # Step 4: Execute tests
        test_results = execute_test_harness(
            test_harness,
            job_data['language'],
            time_limit=job_data.get('time_limit', 5.0),
            memory_limit=job_data.get('memory_limit', 256)
        )
        
        # Step 5: Calculate score
        total_score = calculate_score(
            test_results,
            job_data['test_cases']
        )
        
        # Step 6: Prepare result
        result = {
            'submission_id': submission_id,
            'status': 'completed',
            'total_score': total_score,
            'test_results': test_results,
            'error_message': None
        }
        
        # Step 7: Update database
        update_submission_result(result)
        
        return result
        
    except ParseError as e:
        # Compilation/Syntax error
        result = {
            'submission_id': submission_id,
            'status': 'compilation_error',
            'total_score': 0,
            'test_results': [],
            'error_message': str(e)
        }
        update_submission_result(result)
        return result
        
    except Exception as e:
        # Unexpected error
        log_error(f"Grading failed for submission {submission_id}: {e}")
        result = {
            'submission_id': submission_id,
            'status': 'grading_error',
            'total_score': 0,
            'test_results': [],
            'error_message': 'Internal grading error'
        }
        update_submission_result(result)
        return result
```

---

## 6.4. Resource Limits & Error Handling

### 6.4.1. Time Limit

**Triển khai:**
```python
import signal

def timeout_handler(signum, frame):
    raise TimeoutError("Execution timeout")

# Set alarm
signal.signal(signal.SIGALRM, timeout_handler)
signal.alarm(time_limit_seconds)

try:
    # Run code
    result = execute_code()
finally:
    signal.alarm(0)  # Cancel alarm
```

**Xử lý:**
- Code vượt thời gian → kill process
- Test case đó bị fail với lỗi "Time Limit Exceeded"
- Ghi log execution time thực tế

### 6.4.2. Memory Limit

**Triển khai (Linux):**
```python
import resource

def set_memory_limit(limit_mb):
    """Giới hạn memory sử dụng"""
    limit_bytes = limit_mb * 1024 * 1024
    resource.setrlimit(
        resource.RLIMIT_AS,
        (limit_bytes, limit_bytes)
    )
```

**Xử lý:**
- Vượt memory → MemoryError exception
- Fail test case với lỗi "Memory Limit Exceeded"

### 6.4.3. Security Restrictions

**Cấm các thao tác nguy hiểm:**
```python
FORBIDDEN_IMPORTS = [
    'os', 'sys', 'subprocess', 'socket',
    'requests', 'urllib', 'importlib',
    '__import__', 'eval', 'exec', 'compile'
]

def validate_code_safety(code: str):
    """Kiểm tra code không chứa imports/calls nguy hiểm"""
    tree = ast.parse(code)
    
    for node in ast.walk(tree):
        # Check imports
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            for alias in node.names:
                if alias.name in FORBIDDEN_IMPORTS:
                    raise SecurityError(
                        f"Import '{alias.name}' is not allowed"
                    )
        
        # Check function calls
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                if node.func.id in ['eval', 'exec', '__import__']:
                    raise SecurityError(
                        f"Function '{node.func.id}' is not allowed"
                    )
```

### 6.4.4. Error Types & Messages

**Phân loại lỗi:**

| Error Type | Message | Score | Retry |
|------------|---------|-------|-------|
| Syntax Error | "Line 5: invalid syntax" | 0 | No |
| Compilation Error | "undefined reference to..." | 0 | No |
| Runtime Error | "ZeroDivisionError: ..." | 0-20% | No |
| Time Limit Exceeded | "TLE (>2.0s)" | 0 | No |
| Memory Limit Exceeded | "MLE (>256MB)" | 0 | No |
| Wrong Answer | "Expected 5, got 4" | 0-50% | No |
| Internal Error | "Grader system error" | Regrade | Yes |

**Error Logging:**
```python
{
    "submission_id": 123,
    "timestamp": "2025-10-17T10:30:00Z",
    "error_type": "runtime_error",
    "error_message": "IndexError: list index out of range",
    "traceback": "...",
    "test_case_id": 3,
    "input": "[1, 2, 3]",
    "code_snippet": "..."
}
```

---

## 6.5. Performance Optimization

### 6.5.1. Caching

**Compile cache:**
- Cache compiled binaries cho code giống nhau (hash-based)
- Giảm thời gian compile cho submissions tương tự

**Test case cache:**
- Cache test results cho identical code
- Detect plagiarism (bonus feature)

### 6.5.2. Parallel Execution

**Multi-processing:**
```python
from multiprocessing import Pool

def grade_batch(submissions):
    """Grade nhiều submissions song song"""
    with Pool(processes=4) as pool:
        results = pool.map(grade_submission, submissions)
    return results
```

### 6.5.3. Metrics & Monitoring

**Theo dõi:**
- Average grading time per submission
- Queue depth (pending jobs)
- Worker utilization
- Error rate by error type
- Resource usage (CPU, memory)

**Dashboard metrics:**
```json
{
    "total_graded": 1523,
    "avg_grading_time": 1.2,
    "queue_size": 5,
    "active_workers": 3,
    "error_rate": 0.02,
    "success_rate": 0.98
}
```

---

## 6.6. Sequence Diagram - Grading Flow

```
Student → Backend → RabbitMQ → Worker → Database
   |         |          |          |         |
   |------Submit Code--->|         |         |
   |         |            |         |         |
   |         |--Publish Job-->     |         |
   |         |            |         |         |
   |         |            |---Consume Job---->|
   |         |            |         |         |
   |         |            |         |--Parse Function
   |         |            |         |--Generate Tests
   |         |            |         |--Execute Tests
   |         |            |         |--Calculate Score
   |         |            |         |         |
   |         |            |         |---Update Result-->
   |         |            |         |         |
   |         |<--------Webhook Notify---------|
   |         |            |         |         |
   |<--Return Result------|         |         |
```

---

## 6.7. Tóm tắt

**Những điểm chính của Grader Engine:**

1. **Kiến trúc phân tán**: Sử dụng RabbitMQ để tách biệt API server và grader workers, cho phép xử lý bất đồng bộ và dễ dàng scale

2. **Hai chế độ chấm điểm**:
   - **STDIO Mode**: Phù hợp với bài tập input/output truyền thống
   - **Function Mode**: Phù hợp với bài tập yêu cầu viết hàm cụ thể

3. **Quy trình chấm điểm 4 bước**:
   - `function_parser.py`: Phân tích cú pháp và extract function info
   - `test_harness_generator.py`: Tạo code test tự động
   - `test_function_grading.py`: Thực thi tests với resource limits
   - `grader_function.py`: Tổng hợp và tính điểm cuối cùng

4. **Bảo mật & Resource Management**:
   - Sandboxing để isolate code execution
   - Time limit và memory limit cho mỗi submission
   - Blacklist các imports/functions nguy hiểm
   - Error handling toàn diện với retry mechanism

5. **Tối ưu hiệu suất**:
   - Worker pool architecture hỗ trợ parallel processing
   - Caching để giảm thời gian compile
   - Monitoring và metrics để theo dõi performance

6. **Độ tin cậy**:
   - Message acknowledgment đảm bảo không mất job
   - Comprehensive error logging
   - Database transaction để đảm bảo data consistency

Grader Engine là trái tim của hệ thống, đảm bảo việc chấm điểm được thực hiện một cách **tự động**, **an toàn**, **nhanh chóng** và **chính xác**.

---

## Hướng dẫn sử dụng file này

**Để chuyển đổi sang Word/Google Docs:**

1. **Sử dụng Word**:
   - Mở Microsoft Word
   - File → Open → chọn file `GRADER_ENGINE_DOCUMENTATION.md`
   - Word tự động nhận dạng Markdown format
   - File → Save As → chọn `.docx`

2. **Sử dụng Google Docs**:
   - Upload file lên Google Drive
   - Right-click → Open with → Google Docs
   - File → Download → Microsoft Word (.docx)

3. **Sử dụng công cụ online**:
   - https://products.aspose.app/words/conversion/md-to-docx
   - https://cloudconvert.com/md-to-docx
   - Upload file và convert

**Định dạng sẽ được giữ nguyên:**
- Headings (H1, H2, H3, ...)
- Code blocks với syntax highlighting
- Tables
- Bold, italic text
- Lists (bullet points, numbered)
- Blockquotes

---

*Tài liệu được tạo ngày: 17/10/2025*  
*Dự án: Code Grader System*  
*Tác giả: Development Team*
