# API Contract: Backend ↔️ Worker Communication

This document defines the contract between the **Backend (Python/Flask)** and **Worker (Go)** components.

## Table of Contents
- [RabbitMQ Message Format](#rabbitmq-message-format)
- [Grading Result Format](#grading-result-format)
- [Supported Languages](#supported-languages)
- [Submission Statuses](#submission-statuses)
- [Resource Limits](#resource-limits)
- [Error Handling](#error-handling)

---

## RabbitMQ Message Format

### Queue Information
- **Queue Name**: `grading_queue`
- **Exchange**: Default (direct)
- **Routing Key**: `grading_queue`
- **Durability**: Durable (survives RabbitMQ restart)
- **Message Persistence**: Persistent (`delivery_mode=2`)

### Message Structure (Backend → Worker)

**Topic**: Backend sends grading task to Worker

```json
{
  "submission_id": 123
}
```

**Fields:**
- `submission_id` (int, required): Database ID of the submission to grade

### Retry Mechanism (Worker)

Worker tracks retries internally:
```json
{
  "submission_id": 123,
  "retry_count": 1
}
```

- **Max Retries**: 3
- **Retry Strategy**: Exponential backoff (implicit via requeue delay)
- **Dead Letter**: Messages exceeding max retries are rejected (not requeued)

---

## Grading Result Format

### HTTP Callback (Worker → Backend)

**Endpoint**: `POST {BACKEND_API_URL}/internal/submissions/{submission_id}/result`

**Request Body:**
```json
{
  "overall_status": "Accepted",
  "results": [
    {
      "test_case_id": 1,
      "status": "Accepted",
      "execution_time_ms": 45,
      "memory_used_kb": 2048,
      "output_received": "{\"type\":\"int\",\"value\":3}",
      "error_message": ""
    },
    {
      "test_case_id": 2,
      "status": "Wrong Answer",
      "execution_time_ms": 50,
      "memory_used_kb": 2048,
      "output_received": "{\"type\":\"int\",\"value\":5}",
      "error_message": ""
    }
  ]
}
```

**Fields:**
- `overall_status` (string, required): Overall submission status (see [Submission Statuses](#submission-statuses))
- `results` (array, required): Array of test case results
  - `test_case_id` (int, nullable): Database ID of test case (null for compile errors)
  - `status` (string, required): Status of this test case
  - `execution_time_ms` (int, optional): Execution time in milliseconds
  - `memory_used_kb` (int, optional): Memory used in kilobytes
  - `output_received` (string, optional): Program output (JSON string)
  - `error_message` (string, optional): Error details if failed

### Special Cases

#### Compile Error
```json
{
  "overall_status": "Compile Error",
  "results": [
    {
      "test_case_id": null,
      "status": "Compile Error",
      "execution_time_ms": 0,
      "memory_used_kb": 0,
      "output_received": "",
      "error_message": "main.cpp:5:12: error: expected ';' before '}' token"
    }
  ]
}
```

#### Runtime Error (Global)
```json
{
  "overall_status": "Segmentation Fault",
  "results": [
    {
      "test_case_id": 1,
      "status": "Segmentation Fault",
      "execution_time_ms": 25,
      "memory_used_kb": 1024,
      "output_received": "",
      "error_message": "Program crashed with SIGSEGV (signal 11)"
    }
  ]
}
```

---

## Supported Languages

### Current Support (Version 1.0.0)

| Language | Identifier | File Extension | Handler |
|----------|-----------|----------------|---------|
| C++      | `cpp`     | `.cpp`         | ✅ Implemented |
| Python   | `python`  | `.py`          | ✅ Implemented |
| Java     | `java`    | `.java`        | ✅ Implemented |

### API Endpoints

**Backend:**
```
GET /api/config/languages
```

**Worker:**
```
GET :8080/health
GET :8080/languages
GET :8080/languages/{lang}
```

### Language Characteristics

Each language has resource multipliers:

```go
// C++ (Baseline)
TimeMultiplier:   1.0
MemoryMultiplier: 1.0
MemoryOverhead:   0 KB

// Python
TimeMultiplier:   5.0
MemoryMultiplier: 2.0
MemoryOverhead:   10240 KB (10 MB)

// Java
TimeMultiplier:   2.0
MemoryMultiplier: 1.5
MemoryOverhead:   51200 KB (50 MB)
```

---

## Submission Statuses

### Status Hierarchy

```
Pending (initial)
  ├─ Accepted ✅
  ├─ Wrong Answer ❌
  ├─ Compile Error 🔴
  ├─ Runtime Error 💥
  │   ├─ Segmentation Fault
  │   ├─ Floating Point Exception
  │   ├─ Stack Overflow
  │   ├─ Null Pointer Exception
  │   ├─ Index Error
  │   └─ Arithmetic Error
  ├─ Time Limit Exceeded ⏱️
  ├─ Memory Limit Exceeded 💾
  ├─ Output Limit Exceeded 📄
  └─ System Error 🔥
```

### Status Definitions

| Status | Description | Worker Sends | Backend Stores |
|--------|-------------|--------------|----------------|
| `Pending` | Awaiting grading | ❌ | ✅ (initial) |
| `Accepted` | All test cases passed | ✅ | ✅ |
| `Wrong Answer` | Output doesn't match expected | ✅ | ✅ |
| `Compile Error` | Code failed to compile | ✅ | ✅ |
| `Runtime Error` | Program crashed during execution | ✅ | ✅ |
| `Time Limit Exceeded` | Execution took too long | ✅ | ✅ |
| `Memory Limit Exceeded` | Program used too much memory | ✅ | ✅ |
| `System Error` | Internal grading system error | ✅ | ✅ |

### Constants Location

**Backend:** `backend/app/constants.py`
```python
STATUS_ACCEPTED = 'Accepted'
STATUS_WRONG_ANSWER = 'Wrong Answer'
# ... etc
```

**Worker:** Embedded in grading logic (no centralized constants file yet)

---

## Resource Limits

### Default Limits (Baseline for C++)

```python
DEFAULT_TIME_LIMIT_MS = 1000      # 1 second
DEFAULT_MEMORY_LIMIT_KB = 256000  # 256 MB
```

### Language-Specific Limits

Problems can define custom limits per language:

**Database Schema (JSONB):**
```json
{
  "cpp": {
    "timeMs": 1000,
    "memoryKb": 65536
  },
  "python": {
    "timeMs": 5000,
    "memoryKb": 524288
  },
  "java": {
    "timeMs": 2000,
    "memoryKb": 512000
  }
}
```

**Access Methods:**
- **Backend**: `Problem.get_limit_for_language(language)` → returns (time_ms, memory_kb)
- **Worker**: `Problem.GetLimitForLanguage(language)` → returns (timeMs, memoryKb)

Both methods **fallback to default limits** if language-specific limit not set.

### Limit Validation

**Backend Validation:**
```python
MIN_TIME_LIMIT_MS = 100
MAX_TIME_LIMIT_MS = 10000

MIN_MEMORY_LIMIT_KB = 1024      # 1 MB
MAX_MEMORY_LIMIT_KB = 1048576   # 1 GB
```

**Worker Multiplier Validation:**
```go
// Multipliers must be in range [0.1, 10.0]
if multiplier < 0.1 || multiplier > 10 {
    clamp to valid range
}
```

---

## Error Handling

### Worker Errors

#### 1. Database Connection Lost
- **Action**: Worker logs error, rejects message (nack without requeue)
- **Backend**: Submission remains in "Pending" state
- **Recovery**: Manual intervention required

#### 2. Docker Container Unavailable
- **Action**: Worker retries up to 3 times
- **Backend**: Eventually receives "System Error" status
- **Recovery**: Worker auto-recovers when containers become available

#### 3. Backend API Unreachable
- **Action**: Worker retries HTTP POST with exponential backoff (3 attempts)
- **Backend**: Eventually receives result when API is back online
- **Recovery**: Automatic

#### 4. Invalid Message Format
- **Action**: Worker logs error, rejects message (nack without requeue)
- **Backend**: Submission stuck in "Pending"
- **Recovery**: Manual inspection of RabbitMQ logs

### Backend Errors

#### 1. RabbitMQ Connection Lost
- **Action**: Backend logs error, returns HTTP 500
- **Frontend**: Shows error to user
- **Recovery**: User can retry submission

#### 2. Invalid Grading Result
- **Action**: Backend validates result structure, logs error if invalid
- **Worker**: Receives HTTP 400 response
- **Recovery**: Worker logs issue for debugging

#### 3. Submission Not Found
- **Action**: Backend returns HTTP 404
- **Worker**: Logs warning
- **Recovery**: Message is acknowledged (assumed stale)

---

## Health Check Endpoints

### Worker Health Check

**Endpoint**: `GET :8080/health`

**Response:**
```json
{
  "status": "ok",
  "uptime": "2h15m30s",
  "supported_languages": ["cpp", "python", "java"],
  "container_pool_size": 3,
  "database_status": "ok",
  "tasks_processed": 1234,
  "version": "1.0.0"
}
```

### Backend Health Check

**Endpoint**: `GET /health`

**Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "rabbitmq": "connected"
}
```

---

## Versioning

**Current Version**: 1.0.0

### Version History
- **1.0.0** (Oct 2025): Initial release with C++, Python, Java support
- **Future**: Dynamic language registration, gRPC communication

---

## Notes for Developers

### Adding a New Language

1. **Worker Side:**
   - Implement `LanguageHandler` interface in `grader-engine-go/internal/grader/language/`
   - Register in `registry.go`
   - Add resource multipliers

2. **Backend Side:**
   - Add language identifier to `backend/app/constants.py` → `SUPPORTED_LANGUAGES`
   - Update validation schemas automatically (uses constants)

3. **Testing:**
   - Verify both sides return same supported languages list
   - Test end-to-end grading with new language

### Debugging Communication Issues

1. Check RabbitMQ management UI: http://localhost:15672
2. Inspect worker logs for message consumption
3. Verify backend sends correct submission_id
4. Check worker HTTP callback reaches backend
5. Validate database constraints (foreign keys, nullable fields)

---

**Last Updated**: October 30, 2025  
**Maintained By**: Code Grader Project Team
