# Testing Guide

## Overview

This directory contains tests for the Code Grader backend, including unit tests, integration tests, and compatibility tests with the worker component.

## Test Structure

```
tests/
├── test_compatibility.py    # Backend ↔ Worker integration tests
├── test_constants.py         # Constants validation tests
├── test_config_routes.py     # Config API tests
└── ... (other test files)
```

## Running Tests

### Prerequisites

1. **Install test dependencies:**
```bash
pip install pytest pytest-cov requests
```

2. **Start required services:**
```bash
# In project root
docker-compose up -d
```

### Run All Tests

```bash
# From backend directory
cd backend
pytest
```

### Run Specific Test Categories

```bash
# Unit tests only (no external dependencies)
pytest -m unit

# Integration tests (requires running services)
pytest -m integration

# Compatibility tests (backend-worker sync)
pytest -m compatibility tests/test_compatibility.py

# Specific test file
pytest tests/test_compatibility.py

# Specific test function
pytest tests/test_compatibility.py::TestBackendWorkerCompatibility::test_supported_languages_sync
```

### Run with Coverage

```bash
pytest --cov=app --cov-report=html --cov-report=term
```

View coverage report:
```bash
# Open in browser
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
start htmlcov/index.html  # Windows
```

### Run with Verbose Output

```bash
pytest -v -s  # -v: verbose, -s: show print statements
```

## Important Tests

### 1. Language Synchronization Test

**Critical Test:** Ensures backend and worker support the same programming languages.

```bash
pytest tests/test_compatibility.py::TestBackendWorkerCompatibility::test_supported_languages_sync -v
```

**Why it matters:** If this test fails, users can submit code in languages the worker can't grade, causing failures.

**Expected output:**
```
✅ Languages synchronized: ['cpp', 'java', 'python']
PASSED
```

### 2. Health Check Cache Test

Verifies worker health endpoint caching works correctly.

```bash
pytest tests/test_compatibility.py::TestBackendWorkerCompatibility::test_worker_health_cache_performance -v
```

### 3. Config Cache Headers Test

Ensures backend config endpoints return proper cache headers.

```bash
pytest tests/test_compatibility.py::TestBackendWorkerCompatibility::test_backend_config_cache_headers -v
```

## Test Environment Variables

```bash
# Override default URLs
export BACKEND_URL=http://localhost:5000
export WORKER_URL=http://localhost:8080

# Run tests
pytest
```

## Writing New Tests

### Unit Test Example

```python
# tests/test_constants.py
from app.constants import SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE

def test_supported_languages_not_empty():
    assert len(SUPPORTED_LANGUAGES) > 0

def test_default_language_in_supported():
    assert DEFAULT_LANGUAGE in SUPPORTED_LANGUAGES
```

### Integration Test Example

```python
# tests/test_api.py
import pytest
import requests

@pytest.mark.integration
def test_health_endpoint():
    response = requests.get('http://localhost:5000/health')
    assert response.status_code == 200
```

## Continuous Integration

These tests should be run in CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: |
    docker-compose up -d
    sleep 10  # Wait for services
    cd backend
    pytest -m "not slow" --cov=app
```

## Troubleshooting

### Tests Fail with Connection Error

**Problem:** `requests.exceptions.ConnectionError`

**Solution:** Make sure services are running:
```bash
docker-compose ps
docker-compose logs backend
docker-compose logs worker
```

### Language Sync Test Fails

**Problem:** Backend and worker language lists don't match

**Solution:**
1. Check `backend/app/constants.py` → `SUPPORTED_LANGUAGES`
2. Check `grader-engine-go/internal/grader/language/registry.go`
3. Ensure both lists match exactly

### Cache Tests Fail

**Problem:** Cache headers or X-Cache header missing

**Solution:** Verify recent changes were applied:
- Backend: `config_routes.py` has `add_cache_headers()`
- Worker: `server.go` has caching logic with `X-Cache` header

## Best Practices

1. **Always run tests before pushing:** `pytest -v`
2. **Write tests for new features:** Maintain >80% coverage
3. **Run compatibility tests after changes:** Especially when modifying languages or API contracts
4. **Use markers:** Tag tests appropriately (unit, integration, slow)
5. **Keep tests fast:** Mock external dependencies when possible

## Test Data

Test submissions and problems are created via:
```bash
flask seed-demo-data
```

## Related Documentation

- [API Contract](../../docs/API_CONTRACT.md) - Backend ↔ Worker communication
- [Backend Documentation](../../docs/BACKEND_DOCUMENTATION.md)
- [Worker Documentation](../../docs/WORKER_DOCUMENTATION.md)

---

**Last Updated:** October 30, 2025
