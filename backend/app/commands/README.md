# Flask CLI Commands

This package contains all Flask CLI commands for the Code Grader application.

## Structure

```
commands/
├── __init__.py              # Register all commands
├── seed_db.py              # Initial database seeding (roles)
├── seed_test_data.py       # Seed test users, classes, problems
├── seed_submissions.py     # Seed test submissions with sample solutions
├── cleanup.py              # Cleanup old test submissions
└── problem_templates.py    # Problem definitions for seeding
```

## Usage

### 1. Seed Database (Roles)
```bash
flask seed_db
```
Creates initial teacher and student roles.

### 2. Seed Test Data
```bash
flask seed_test_data
```
Creates:
- 1 Teacher (teacher.test@example.com / password123)
- 3 Students (alice/bob/charlie@example.com / password123)
- 2 Classes (CS301 C++, CS101 Python)
- 7 Problems across Python/C++/Java

### 3. Seed Test Submissions
```bash
flask seed_test_submissions
```
Creates 21 test submissions (3 per problem):
- Correct solutions
- Wrong solutions
- Partial/Compile Error/Runtime Error/TLE

Automatically publishes to RabbitMQ for grading.

### 4. Cleanup Old Submissions
```bash
flask cleanup_test_submissions
```
Removes test submissions older than 1 hour.

## Complete Setup Flow

```bash
# 1. Initialize roles
docker compose exec backend flask seed_db

# 2. Create test data
docker compose exec backend flask seed_test_data

# 3. Generate submissions (optional)
docker compose exec backend flask seed_test_submissions

# 4. Cleanup (when needed)
docker compose exec backend flask cleanup_test_submissions
```

## Architecture

Each command is in its own file for better maintainability:

- **Separation of Concerns**: Each file handles one specific seeding task
- **Modularity**: Easy to add/modify/remove individual commands
- **Testability**: Each command can be tested independently
- **Clean Code**: ~300-400 lines per file instead of 1200+ line monolith

## Sample Solutions

Test submissions in `seed_submissions.py` include:

- **Python**: Two Sum, Rotate Image, Fibonacci (with complete `class Solution`)
- **C++**: Palindrome Number, Valid Anagram, Container With Water (with headers + class)
- **Java**: Reverse String (with package + class)

All solutions follow LeetCode-style format with complete class wrappers, not just function bodies.
