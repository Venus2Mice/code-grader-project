# Tài Liệu Worker Component - Code Grader System

## 📋 Mục Lục
1. [Giới Thiệu](#giới-thiệu)
2. [Kiến Trúc Tổng Quan](#kiến-trúc-tổng-quan)
3. [Cơ Chế Hoạt Động](#cơ-chế-hoạt-động)
4. [Các File Core](#các-file-core)
5. [Container Pool Management](#container-pool-management)
6. [Grading Modes](#grading-modes)
7. [Optimizations](#optimizations)
8. [Error Handling](#error-handling)
9. [Deployment](#deployment)

---

## 🎯 Giới Thiệu

**Worker** là thành phần core của hệ thống Code Grader, chịu trách nhiệm thực thi và chấm điểm các bài nộp của sinh viên. Worker hoạt động như một microservice độc lập, lắng nghe các grading tasks từ RabbitMQ message queue và xử lý chúng trong môi trường Docker sandbox được cô lập.

### Đặc điểm chính:
- ⚡ **Hiệu suất cao**: Sử dụng container pool để giảm overhead từ 2-3s xuống ~100-200ms
- 🔒 **Bảo mật**: Chạy code trong Docker containers với resource limits (CPU, Memory)
- 📊 **Khả năng mở rộng**: Có thể chạy nhiều worker instances để xử lý concurrent submissions
- 🎨 **Đa dạng**: Hỗ trợ cả STDIO-based và Function-based grading
- 🛡️ **Robust**: Xử lý errors, timeouts, memory limits, và retry logic

---

## 🏗️ Kiến Trúc Tổng Quan

```
┌─────────────────────────────────────────────────────────────┐
│                        WORKER SYSTEM                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │  RabbitMQ    │─────▶│  Main Loop   │                     │
│  │   Consumer   │      │  (main.py)   │                     │
│  └──────────────┘      └───────┬──────┘                     │
│                                 │                            │
│                        ┌────────▼────────┐                  │
│                        │  Grade Manager  │                  │
│                        │   (grader.py)   │                  │
│                        └────────┬────────┘                  │
│                                 │                            │
│         ┌───────────────────────┼───────────────────────┐   │
│         │                       │                       │   │
│  ┌──────▼──────┐       ┌───────▼──────┐       ┌────────▼─────┐
│  │   STDIO     │       │  FUNCTION    │       │  Container   │
│  │   Grading   │       │  Grading     │       │    Pool      │
│  │ (grader.py) │       │(grader_func) │       │(container_   │
│  └─────────────┘       └──────────────┘       │  pool.py)    │
│                                                └──────┬───────┘
│                                                       │
│  ┌──────────────────────────────────────────────────▼─────┐
│  │            Docker Containers (Sandbox)                  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  │Container1│  │Container2│  │Container3│   (Pool)     │
│  │  └──────────┘  └──────────┘  └──────────┘             │
│  └─────────────────────────────────────────────────────────┘
│                                                               │
│  ┌────────────────────┐       ┌─────────────────────────┐   │
│  │   Database (SQLAlchemy)    │   Backend API Client     │   │
│  │   - Fetch submissions      │   - Update results       │   │
│  │   - Fetch test cases       │   - Async updates        │   │
│  └────────────────────┘       └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Luồng dữ liệu:
1. **Backend** nhận submission → Đẩy task vào **RabbitMQ queue**
2. **Worker** lắng nghe queue → Nhận task mới
3. Worker lấy **container từ pool** → Tiết kiệm thời gian tạo container
4. Worker **copy code** vào container → Compile → Run test cases
5. Worker thu thập **kết quả** → Gửi về Backend API (async)
6. Container được **return về pool** → Tái sử dụng cho submission tiếp theo

---

## ⚙️ Cơ Chế Hoạt Động

### 1. Khởi Động Worker

```python
# main.py - main() function
def main():
    # Bước 1: Initialize container pool
    container_pool = initialize_container_pool(pool_size=3)
    
    # Bước 2: Start background thread cho async backend updates
    update_worker_thread = threading.Thread(target=backend_update_worker, daemon=True)
    update_worker_thread.start()
    
    # Bước 3: Connect to RabbitMQ với retry logic
    connection = pika.BlockingConnection(...)
    channel = connection.channel()
    
    # Bước 4: Listen for tasks
    channel.basic_consume(queue='grading_queue', on_message_callback=callback)
    channel.start_consuming()
```

### 2. Xử Lý Task

```python
# main.py - callback() function
def callback(ch, method, properties, body):
    # Parse task data
    task_data = json.loads(body.decode())
    submission_id = task_data.get('submission_id')
    
    # Grade submission
    result = grade_submission(submission_id)
    
    # Send result to backend (async)
    update_backend_async(submission_id, result)
    
    # Acknowledge task
    ch.basic_ack(delivery_tag=method.delivery_tag)
```

### 3. Grading Flow

```python
# grader.py - grade_submission() function
def grade_submission(submission_id):
    # 1. Fetch submission từ database (with eager loading)
    submission = db_session.query(Submission)\
        .options(joinedload(Submission.problem).joinedload(Problem.test_cases))\
        .get(submission_id)
    
    # 2. Get container từ pool
    container = container_pool.get_container()
    
    # 3. Copy code vào container
    container.put_archive("/sandbox", tar_data)
    
    # 4. Route theo grading mode
    if grading_mode == 'function':
        result = grade_function_based(...)
    else:
        result = grade_stdio(...)
    
    # 5. Return container về pool
    container_pool.return_container(container)
    
    # 6. Cleanup temp files
    shutil.rmtree(temp_dir_path)
    
    return result
```

---

## 📁 Các File Core

### 1. `main.py` - Entry Point & Message Queue Handler

**Chức năng:**
- Khởi động worker process
- Kết nối với RabbitMQ message queue
- Lắng nghe và xử lý grading tasks
- Quản lý async backend updates
- Xử lý graceful shutdown

**Các thành phần chính:**

#### a) RabbitMQ Consumer
```python
channel.basic_consume(queue='grading_queue', on_message_callback=callback)
```
- Lắng nghe queue `grading_queue`
- Prefetch count = 1 (xử lý 1 task tại 1 thời điểm)
- Durable queue (tasks survive RabbitMQ restart)

#### b) Async Backend Updates
```python
backend_update_queue = Queue(maxsize=100)

def backend_update_worker():
    """Background thread xử lý async updates"""
    while True:
        submission_id, result_data = backend_update_queue.get()
        update_backend_sync(submission_id, result_data)
```
- Fire-and-forget pattern
- Giảm latency trong grading flow từ 200-500ms
- Retry logic với exponential backoff

#### c) Retry Logic
```python
for attempt in range(retries):
    try:
        response = requests.post(url, json=result_data, timeout=10)
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        wait_time = (2 ** attempt)  # 1s, 2s, 4s
        time.sleep(wait_time)
```

---

### 2. `grader.py` - Core Grading Engine

**Chức năng:**
- Điều phối quá trình chấm điểm
- Quản lý Docker containers
- Route giữa các grading modes
- Thu thập và format kết quả

**Các hàm chính:**

#### a) `grade_submission(submission_id)`
Main orchestrator function:
1. **Database eager loading** - Tối ưu N+1 query problem
2. **Container pool management** - Lấy container từ pool
3. **Code preparation** - Copy code vào sandbox
4. **Mode routing** - STDIO hoặc Function-based
5. **Cleanup** - Return container và xóa temp files

#### b) `grade_stdio(...)` 
STDIO-based grading:
```python
def grade_stdio(submission, problem, test_cases, container, temp_dir_path, submission_id):
    # 1. Compile code
    compile_result = container.exec_run("g++ -std=c++17 -O1 main.cpp -o main")
    
    # 2. Run test cases (parallel execution)
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {executor.submit(run_single_test_case, container, tc, ...): tc 
                   for tc in test_cases}
        
        for future in as_completed(futures):
            result = future.result()
            results_list.append(result)
    
    # 3. Return results
    return {"overall_status": ..., "results": results_list}
```

**Tính năng:**
- ✅ Parallel test execution (20-30% faster với multiple test cases)
- ✅ Tối ưu compilation: `-O1` thay vì `-O2` (2x faster)
- ✅ Comprehensive error detection (TLE, MLE, RE, WA)

#### c) `run_single_test_case(...)` 
Chạy 1 test case đơn lẻ:
```python
def run_single_test_case(container, tc, problem, submission_id):
    time_limit_sec = problem.time_limit_ms / 1000.0
    
    # Execute với timeout
    exec_result = container.exec_run(
        f"timeout {time_limit_sec} ./main",
        stdin=True,
        input=tc.input_data.encode('utf-8')
    )
    
    # Analyze exit code
    if exit_code == 124:  # timeout
        tc_status = "Time Limit Exceeded"
    elif exit_code == 137:  # SIGKILL
        tc_status = "Memory Limit Exceeded"
    elif exit_code == 139:  # SIGSEGV
        tc_status = "Runtime Error"
    # ... more checks
    
    return {"test_case_id": tc.id, "status": tc_status, ...}
```

**Exit code mapping:**
- `124` - Time Limit Exceeded
- `137` - Memory Limit Exceeded (SIGKILL)
- `139` - Segmentation Fault (SIGSEGV)
- `136` - Floating Point Exception (SIGFPE)
- `134` - Program Aborted (SIGABRT)

---

### 3. `container_pool.py` - Container Pool Manager

**Vấn đề cần giải quyết:**
- Tạo Docker container mới cho mỗi submission tốn **2-3 giây**
- Overhead này chiếm 60-70% thời gian grading
- Cần giải pháp tái sử dụng containers

**Giải pháp: Container Pool**

```python
class ContainerPool:
    def __init__(self, pool_size: int = 3):
        self.available_containers = []  # Stack của containers sẵn sàng
        self.in_use_containers = set()  # Containers đang dùng
        self.lock = Lock()  # Thread safety
        
        # Pre-create containers
        for i in range(pool_size):
            container = self._create_sandbox_container()
            self.available_containers.append(container)
```

#### Workflow:

**1. Get Container:**
```python
def get_container(self):
    with self.lock:  # Thread-safe
        # Try to get from pool
        if self.available_containers:
            container = self.available_containers.pop()
            if container.status == 'running':
                self.in_use_containers.add(container.id)
                return container
        
        # Pool empty → Create new container on-demand
        container = self._create_sandbox_container()
        self.in_use_containers.add(container.id)
        return container
```

**2. Return Container:**
```python
def return_container(self, container):
    with self.lock:
        # Deep clean container
        container.exec_run("sh -c 'rm -rf /sandbox && mkdir -p /sandbox'")
        
        if container.status == 'running':
            self.in_use_containers.remove(container.id)
            
            if len(self.available_containers) < self.pool_size:
                self.available_containers.append(container)  # Return to pool
            else:
                container.remove()  # Pool full, destroy container
```

**3. Container Spec:**
```python
def _create_sandbox_container(self):
    container = self.docker_client.containers.run(
        "cpp-grader-env",  # Docker image
        command=["sleep", "3600"],  # Keep alive
        detach=True,
        mem_limit='256m',  # Memory limit
        auto_remove=False  # Manual cleanup
    )
    return container
```

**Tối ưu:**
- ✅ Giảm overhead từ **2-3s** xuống **~100-200ms**
- ✅ Thread-safe với `Lock()`
- ✅ Health checking - loại bỏ containers bị die
- ✅ Deep clean giữa các submissions - tránh contamination
- ✅ On-demand scaling - tạo thêm containers khi cần

---

### 4. `grader_function.py` - Function-Based Grading

**Khái niệm:**
Thay vì chạy program hoàn chỉnh với STDIO, function-based grading:
- Sinh viên viết **function** theo signature cho trước
- System generate **test harness** tự động
- Test harness gọi function với các test cases

**Ví dụ:**
```cpp
// Problem signature
vector<int> twoSum(vector<int>& nums, int target)

// Student code (chỉ implement function)
vector<int> twoSum(vector<int>& nums, int target) {
    // ... student implementation
}

// System generates test harness
int main() {
    // Read input
    // Call student's twoSum()
    // Print output
}
```

**Workflow:**

#### 1. Parse Function Signature
```python
parsed_signature = FunctionSignatureParser.parse(problem.function_signature)
# Result: {
#   'return_type': 'vector<int>',
#   'function_name': 'twoSum',
#   'parameters': [('vector<int>&', 'nums'), ('int', 'target')]
# }
```

#### 2. Generate Test Harness
```python
test_harness_code = TestHarnessGenerator.generate(
    parsed_signature, 
    submission.source_code
)
```

**Generated code example:**
```cpp
#include <iostream>
#include <vector>
using namespace std;

// Student's function
vector<int> twoSum(vector<int>& nums, int target) {
    // ... student code
}

// Test harness
int main() {
    // Read vector size
    int n;
    cin >> n;
    
    // Read vector elements
    vector<int> nums(n);
    for (int i = 0; i < n; i++) {
        cin >> nums[i];
    }
    
    // Read target
    int target;
    cin >> target;
    
    // Call student function
    vector<int> result = twoSum(nums, target);
    
    // Print result
    for (int i = 0; i < result.size(); i++) {
        cout << result[i];
        if (i < result.size() - 1) cout << " ";
    }
    cout << endl;
    
    return 0;
}
```

#### 3. Compile & Run
```python
# Copy test harness to container
container.put_archive("/sandbox", tar_data)

# Compile (same as STDIO)
compile_result = container.exec_run("g++ -std=c++17 -O1 main.cpp -o main")

# Run each test case
for tc in test_cases:
    # Create input file
    container.put_archive("/sandbox", input_tar)
    
    # Execute
    exec_result = container.exec_run(
        f"sh -c 'timeout {time_limit_sec} ./main < /sandbox/input.txt'"
    )
    
    # Compare output
    if output_str == expected_output_str:
        status = "Accepted"
```

**Lợi ích:**
- ✅ Focus vào logic thuật toán (không cần xử lý I/O)
- ✅ Dễ test các data structures phức tạp
- ✅ Phù hợp cho các bài toán kiểu LeetCode

---

### 5. `function_parser.py` - C++ Function Signature Parser

**Chức năng:**
Parse C++ function signature phức tạp thành các components

**Hỗ trợ:**
- Template types: `vector<int>`, `map<string, int>`
- References: `vector<int>&`, `const string&`
- Pointers: `int*`, `char**`
- Multiple parameters

**Example:**
```python
signature = "vector<int> twoSum(vector<int>& nums, int target)"
parsed = FunctionSignatureParser.parse(signature)

# Result:
{
    'return_type': 'vector<int>',
    'function_name': 'twoSum',
    'parameters': [
        ('vector<int>&', 'nums'),
        ('int', 'target')
    ]
}
```

**Implementation highlights:**
```python
@staticmethod
def parse(signature: str) -> Optional[Dict]:
    # 1. Find opening parenthesis
    paren_pos = signature.find('(')
    
    # 2. Split before parenthesis → return_type + function_name
    before_paren = signature[:paren_pos].strip()
    parts = before_paren.split()
    function_name = parts[-1]
    return_type = ' '.join(parts[:-1])
    
    # 3. Extract parameters
    params_str = signature[paren_pos + 1 : signature.rfind(')')].strip()
    parameters = FunctionSignatureParser._parse_parameters(params_str)
    
    return {...}
```

**Smart Split:**
```python
def _smart_split(text: str, delimiter: str) -> List[str]:
    """Split by delimiter nhưng respect template brackets"""
    result = []
    current = []
    depth = 0  # Track nesting level of <>
    
    for char in text:
        if char == '<':
            depth += 1
        elif char == '>':
            depth -= 1
        elif char == delimiter and depth == 0:
            result.append(''.join(current))
            current = []
            continue
        
        current.append(char)
    
    if current:
        result.append(''.join(current))
    
    return result
```

---

### 6. `test_harness_generator.py` - Auto Test Harness Generator

**Chức năng:**
Generate C++ test harness code tự động dựa trên function signature

**Các loại types được hỗ trợ:**
- `int`, `long`, `float`, `double` - Primitive types
- `string` - String type
- `vector<T>` - Vector of any type T
- `char`, `bool` - Character and boolean
- Nested types: `vector<vector<int>>`

**Generation logic:**

#### 1. Main Structure
```cpp
#include <iostream>
#include <vector>
#include <string>
using namespace std;

// Student's function code here
{student_code}

// Generated main function
int main() {
    // Read inputs
    {input_reading_code}
    
    // Call function
    {function_call}
    
    // Print output
    {output_printing_code}
    
    return 0;
}
```

#### 2. Input Reading Generator
```python
def _generate_input_reading(param_type: str, param_name: str) -> str:
    if param_type.startswith('vector<'):
        # Vector input
        return f"""
    int {param_name}_size;
    cin >> {param_name}_size;
    {clean_type} {param_name}({param_name}_size);
    for (int i = 0; i < {param_name}_size; i++) {{
        cin >> {param_name}[i];
    }}
        """
    elif 'int' in param_type or 'long' in param_type:
        # Primitive number
        return f"{clean_type} {param_name}; cin >> {param_name};"
    elif 'string' in param_type:
        # String
        return f"string {param_name}; cin >> {param_name};"
```

#### 3. Output Printing Generator
```python
def _generate_output_printing(return_type: str) -> str:
    if return_type.startswith('vector<'):
        # Vector output
        return """
    for (size_t i = 0; i < result.size(); i++) {
        cout << result[i];
        if (i < result.size() - 1) cout << " ";
    }
    cout << endl;
        """
    elif return_type == 'void':
        # No output
        return ""
    else:
        # Single value
        return "cout << result << endl;"
```

**Example output:**
```cpp
#include <iostream>
#include <vector>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // Student code
}

int main() {
    int nums_size;
    cin >> nums_size;
    vector<int> nums(nums_size);
    for (int i = 0; i < nums_size; i++) {
        cin >> nums[i];
    }
    
    int target;
    cin >> target;
    
    vector<int> result = twoSum(nums, target);
    
    for (size_t i = 0; i < result.size(); i++) {
        cout << result[i];
        if (i < result.size() - 1) cout << " ";
    }
    cout << endl;
    
    return 0;
}
```

---

### 7. `config.py` - Configuration Management

```python
class Config:
    # Database connection
    DATABASE_URL = os.environ.get('DATABASE_URL')
    
    # RabbitMQ connection
    RABBITMQ_HOST = os.environ.get('RABBITMQ_HOST', 'localhost')
    
    # Backend API endpoint
    BACKEND_API_URL = os.environ.get('BACKEND_API_URL', 'http://localhost:5000')
    
    # Docker image name
    DOCKER_IMAGE_NAME = "cpp-grader-env"
    
    # Temp directory paths
    GRADER_TEMP_DIR = os.environ.get('GRADER_TEMP_DIR', '/tmp/grader_submissions')
    HOST_GRADER_TEMP_DIR = os.environ.get('HOST_GRADER_TEMP_DIR', GRADER_TEMP_DIR)
```

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `RABBITMQ_HOST` - RabbitMQ server hostname
- `BACKEND_API_URL` - Backend API base URL
- `GRADER_TEMP_DIR` - Temp directory trong worker container
- `HOST_GRADER_TEMP_DIR` - Temp directory trên Docker host (cho bind mounts)

---

### 8. `database.py` - Database Connection Manager

```python
# Create SQLAlchemy engine
engine = create_engine(Config.DATABASE_URL)

# Create scoped session factory (thread-safe)
session_factory = sessionmaker(bind=engine)
Session = scoped_session(session_factory)

def get_db_session():
    """Get database session"""
    return Session()
```

**Thread Safety:**
- `scoped_session` đảm bảo mỗi thread có session riêng
- Tránh race conditions khi multiple workers chạy parallel

---

### 9. `models.py` - Database Models

```python
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

Base = declarative_base()

class Submission(Base):
    __tablename__ = 'submissions'
    
    id = Column(Integer, primary_key=True)
    problem_id = Column(Integer, ForeignKey('problems.id'))
    user_id = Column(Integer, ForeignKey('users.id'))
    source_code = Column(Text)
    status = Column(String(50))
    created_at = Column(DateTime)
    
    # Relationships
    problem = relationship("Problem")

class Problem(Base):
    __tablename__ = 'problems'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255))
    description = Column(Text)
    time_limit_ms = Column(Integer)
    memory_limit_mb = Column(Integer)
    grading_mode = Column(String(20))  # 'stdio' or 'function'
    function_signature = Column(Text)  # For function-based
    
    # Relationships
    test_cases = relationship("TestCase")

class TestCase(Base):
    __tablename__ = 'test_cases'
    
    id = Column(Integer, primary_key=True)
    problem_id = Column(Integer, ForeignKey('problems.id'))
    input_data = Column(Text)
    expected_output = Column(Text)
    is_sample = Column(Boolean)
```

---

## 🚀 Optimizations

### 1. Container Pool (2-3s → ~100-200ms)
**Before:**
```python
# Tạo container mới cho mỗi submission
container = docker_client.containers.run(...)  # 2-3s
# ... grade submission
container.stop()
container.remove()
```

**After:**
```python
# Reuse containers từ pool
container = container_pool.get_container()  # ~100-200ms
# ... grade submission
container_pool.return_container(container)  # Deep clean & reuse
```

**Impact:** Giảm 60-70% thời gian grading

---

### 2. Database Eager Loading (3 queries → 1 query)
**Before:**
```python
submission = db.query(Submission).get(submission_id)  # Query 1
problem = submission.problem  # Query 2 (lazy load)
test_cases = problem.test_cases  # Query 3 (lazy load)
```

**After:**
```python
submission = db.query(Submission)\
    .options(
        joinedload(Submission.problem).joinedload(Problem.test_cases)
    )\
    .get(submission_id)  # Single query with JOIN
```

**Impact:** Giảm database round trips từ 3 → 1

---

### 3. Async Backend Updates (200-500ms savings)
**Before:**
```python
result = grade_submission(submission_id)
update_backend_sync(submission_id, result)  # Block 200-500ms
ack_task()
```

**After:**
```python
result = grade_submission(submission_id)
update_backend_async(submission_id, result)  # Fire & forget
ack_task()  # Immediate ACK
```

**Implementation:**
```python
backend_update_queue = Queue(maxsize=100)

def backend_update_worker():
    """Background thread"""
    while True:
        submission_id, result = backend_update_queue.get()
        update_backend_sync(submission_id, result)
```

**Impact:** Giảm latency trong grading pipeline

---

### 4. Parallel Test Execution (20-30% faster)
**Before:**
```python
for tc in test_cases:
    result = run_test_case(tc)  # Sequential
    results.append(result)
```

**After:**
```python
with ThreadPoolExecutor(max_workers=3) as executor:
    futures = {executor.submit(run_test_case, tc): tc for tc in test_cases}
    
    for future in as_completed(futures):
        result = future.result()
        results.append(result)
```

**Impact:** Test cases chạy parallel (I/O bound operations)

---

### 5. Compilation Optimization (-O1 vs -O2)
**Before:**
```bash
g++ -std=c++17 -O2 main.cpp -o main  # Slower compilation
```

**After:**
```bash
g++ -std=c++17 -O1 main.cpp -o main  # 2x faster compilation
```

**Trade-off:** 
- Compilation: 2x faster
- Runtime: ~5% slower (negligible cho educational problems)
- Overall: Net positive vì compile overhead lớn hơn

---

### 6. Retry Logic với Exponential Backoff
```python
def update_backend_sync(submission_id, result_data, retries=3):
    for attempt in range(retries):
        try:
            response = requests.post(url, json=result_data, timeout=10)
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            if attempt < retries - 1:
                wait_time = (2 ** attempt)  # 1s, 2s, 4s
                time.sleep(wait_time)
            else:
                print(f"Failed after {retries} attempts")
                return False
```

**Impact:** Improved reliability with transient failures

---

## 🛡️ Error Handling

### 1. Compilation Errors
```python
compile_result = container.exec_run("g++ -std=c++17 -O1 main.cpp -o main")

if compile_result.exit_code != 0:
    compile_output = compile_result.output.decode('utf-8')
    return {
        "overall_status": "Compile Error",
        "results": [{
            "test_case_id": None,
            "status": "Compile Error",
            "error_message": compile_output
        }]
    }
```

---

### 2. Runtime Errors
```python
# Exit code mapping
if exit_code == 124:
    status = "Time Limit Exceeded"
elif exit_code == 137:  # SIGKILL
    status = "Memory Limit Exceeded"
elif exit_code == 139:  # SIGSEGV
    status = "Runtime Error (Segmentation Fault)"
elif exit_code == 136:  # SIGFPE
    status = "Runtime Error (Floating Point Exception)"
elif exit_code == 134:  # SIGABRT
    status = "Runtime Error (Aborted)"
elif exit_code != 0:
    status = "Runtime Error"
```

---

### 3. System Errors
```python
try:
    result = grade_submission(submission_id)
except Exception as e:
    print(f"System error: {e}")
    result = {
        "overall_status": "System Error",
        "results": [{
            "test_case_id": None,
            "status": "System Error",
            "error_message": str(e)
        }]
    }
```

---

### 4. RabbitMQ Connection Retry
```python
retry_interval = 5
max_retries = 10

for i in range(max_retries):
    try:
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=Config.RABBITMQ_HOST)
        )
        break
    except pika.exceptions.AMQPConnectionError:
        print(f"Connection failed. Retrying in {retry_interval}s...")
        time.sleep(retry_interval)
```

---

### 5. Container Health Checks
```python
def return_container(self, container):
    try:
        container.reload()  # Check status
        
        if container.status == 'running':
            # Clean & return to pool
            container.exec_run("sh -c 'rm -rf /sandbox && mkdir -p /sandbox'")
            self.available_containers.append(container)
        else:
            # Container died → remove it
            container.remove(force=True)
    except Exception as e:
        print(f"Error checking container health: {e}")
        # Remove potentially corrupted container
        container.remove(force=True)
```

---

## 🚀 Deployment

### 1. Docker Setup

**Dockerfile:**
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy worker code
COPY worker/ ./worker/

# Run worker
CMD ["python", "-m", "worker.main"]
```

**Requirements:**
```txt
pika==1.3.0
requests==2.31.0
SQLAlchemy==1.4.46
psycopg2-binary==2.9.5
docker==6.0.1
python-dotenv==1.0.0
```

---

### 2. Docker Compose

```yaml
version: '3.8'

services:
  worker:
    build:
      context: ./grader-engine
      dockerfile: Dockerfile.worker
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/codegrade
      - RABBITMQ_HOST=rabbitmq
      - BACKEND_API_URL=http://backend:5000
      - GRADER_TEMP_DIR=/tmp/grader_submissions
      - HOST_GRADER_TEMP_DIR=/tmp/grader_submissions
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock  # Docker-in-Docker
      - grader-temp:/tmp/grader_submissions
    depends_on:
      - rabbitmq
      - db
    restart: unless-stopped
    deploy:
      replicas: 3  # Run 3 worker instances

volumes:
  grader-temp:
```

---

### 3. Build & Run

```bash
# Build Docker image
docker build -t cpp-grader-env -f grader-engine/Dockerfile .

# Build worker
docker build -t worker -f grader-engine/Dockerfile.worker .

# Run with docker-compose
docker-compose up -d --build worker

# Scale workers
docker-compose up -d --scale worker=5

# View logs
docker-compose logs -f worker

# Stop workers
docker-compose stop worker
```

---

### 4. Environment Variables

Create `.env` file:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/code_grader
RABBITMQ_HOST=localhost
BACKEND_API_URL=http://localhost:5000
GRADER_TEMP_DIR=/tmp/grader_submissions
HOST_GRADER_TEMP_DIR=/tmp/grader_submissions
```

---

### 5. Monitoring

**Worker Health Check:**
```python
# Add health check endpoint
@app.route('/health')
def health():
    return {
        'status': 'healthy',
        'container_pool_size': len(container_pool.available_containers),
        'in_use_containers': len(container_pool.in_use_containers)
    }
```

**Metrics to monitor:**
- ✅ Queue length (RabbitMQ)
- ✅ Processing time per submission
- ✅ Container pool utilization
- ✅ Error rates
- ✅ Database connection health

---

## 📊 Performance Metrics

### Typical Grading Times:

| Scenario | Before Optimization | After Optimization | Improvement |
|----------|-------------------|-------------------|-------------|
| Container creation | 2-3s | ~100-200ms | **93% faster** |
| Database queries | 3 queries | 1 query | **67% reduction** |
| Backend update | 200-500ms (blocking) | ~0ms (async) | **100% removed from critical path** |
| Test execution (5 tests) | Sequential | Parallel | **20-30% faster** |
| Compilation | -O2 (~2s) | -O1 (~1s) | **50% faster** |

**Overall:**
- Simple submission (1 test): **~1-2s** (was ~5-7s)
- Complex submission (10 tests): **~3-5s** (was ~15-20s)
- Throughput: **~20-30 submissions/minute** per worker

---

## 🔒 Security Considerations

### 1. Sandbox Isolation
```python
container = docker_client.containers.run(
    image="cpp-grader-env",
    mem_limit='256m',  # Memory limit
    network_disabled=True,  # No network access (can be enabled)
    read_only=False,  # /sandbox needs write access
    security_opt=['no-new-privileges']  # Prevent privilege escalation
)
```

### 2. Resource Limits
- **Memory:** 256MB per container
- **Time:** Configurable per problem (typically 1-5s)
- **CPU:** Shared, but limited by container scheduling

### 3. Code Isolation
- Mỗi submission chạy trong container riêng
- Deep clean giữa các submissions
- No shared state giữa các lần chấm

### 4. Input Validation
- Validate submission code size
- Sanitize file paths
- Prevent path traversal attacks

---

## 🎯 Best Practices

### 1. Error Handling
- Always use try-except blocks
- Log errors với context (submission_id)
- Return meaningful error messages
- Implement retry logic cho external calls

### 2. Resource Management
- Always cleanup resources trong `finally` blocks
- Return containers về pool
- Close database sessions
- Remove temp files

### 3. Logging
```python
print(f"[{submission_id}] Starting grading...")
print(f"[{submission_id}] Compilation successful")
print(f"[{submission_id}] Test Case #{tc.id}: Status='{status}'")
print(f"[{submission_id}] Grading completed")
```

### 4. Threading Safety
- Use `Lock()` cho shared resources
- Use `scoped_session` cho database
- Avoid race conditions trong container pool

### 5. Testing
- Unit tests cho parsers và generators
- Integration tests cho grading flow
- Load testing cho performance validation

---

## 🔮 Future Improvements

### 1. Multi-Language Support
- Add support cho Python, Java, JavaScript
- Language-specific containers
- Dynamic container selection

### 2. Advanced Grading
- Custom checkers (cho floating point comparison)
- Interactive problems
- Special judge functions

### 3. Monitoring & Analytics
- Prometheus metrics
- Grafana dashboards
- Real-time alerting

### 4. Scalability
- Kubernetes deployment
- Auto-scaling based on queue length
- Distributed container pools

### 5. Security Enhancements
- Seccomp profiles
- AppArmor/SELinux policies
- Stricter resource limits

---

## 📚 References

- [Docker Python SDK Documentation](https://docker-py.readthedocs.io/)
- [Pika (RabbitMQ) Documentation](https://pika.readthedocs.io/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [C++ Competitive Programming](https://cp-algorithms.com/)

---

## 🤝 Contributing

When modifying worker code:
1. Test locally với sample submissions
2. Check memory leaks và resource cleanup
3. Validate với multiple test cases
4. Update documentation
5. Add logging cho debugging

---

## 📞 Troubleshooting

### Common Issues:

**1. Container pool initialization fails:**
```bash
# Check Docker daemon
docker ps

# Check image exists
docker images | grep cpp-grader-env

# Rebuild image
docker build -t cpp-grader-env .
```

**2. RabbitMQ connection fails:**
```bash
# Check RabbitMQ is running
docker ps | grep rabbitmq

# Check connection
telnet localhost 5672
```

**3. Database connection fails:**
```bash
# Check DATABASE_URL environment variable
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

**4. High memory usage:**
```bash
# Check container stats
docker stats

# Reduce pool size in config
container_pool = initialize_container_pool(pool_size=2)
```

---

## 📝 Conclusion

Worker component là trái tim của hệ thống Code Grader, được thiết kế với focus vào:
- ⚡ **Performance** - Container pooling, parallel execution, optimized compilation
- 🔒 **Security** - Sandbox isolation, resource limits, code validation
- 🛡️ **Reliability** - Error handling, retry logic, health checks
- 📈 **Scalability** - Multiple workers, message queue, stateless design

Với các optimizations đã implement, worker có thể xử lý **20-30 submissions/minute** per instance, đảm bảo response time nhanh cho người dùng và khả năng scale tốt khi load tăng.

---

**Document Version:** 1.0  
**Last Updated:** October 18, 2025  
**Author:** Code Grader Team
