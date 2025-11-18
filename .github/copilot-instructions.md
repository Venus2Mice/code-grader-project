# Code Grader Project - AI Agent Instructions

## Architecture Overview

This is a **microservices-based automated code grading platform** with three main components:

1. **Backend** (Flask/Python): REST API, authentication, problem management
2. **Frontend** (Vite/React/TypeScript): Neo-brutalism UI, Monaco code editor
3. **Grader Engine** (Go): High-performance worker that executes code in Docker sandboxes

### Data Flow

```
Student submits code → Backend saves to PostgreSQL + publishes to RabbitMQ → 
Go worker consumes message → Executes code in Docker sandbox → Updates database → 
Backend returns results to frontend
```

### Key Integration Points

- **RabbitMQ**: Async communication between backend and grader worker (`grading_queue`)
- **PostgreSQL**: Shared database (accessed via SQLAlchemy in backend, GORM in Go worker)
- **Docker**: Worker manages pool of reusable sandbox containers (`code-grader-project-sandbox:latest`)
- **Public Tokens**: Opaque identifiers for API resources (never expose internal IDs)

## SOLID Architecture Principles

This codebase strictly follows **SOLID principles** - review `AGENTS.md` before making changes:

1. **Single Responsibility**: Separate services for grading logic, Docker operations, database access
2. **Open-Closed**: Language handlers are extensible via interfaces (`LanguageHandler` in Go, not modifying core grader)
3. **Interface Segregation**: Small, focused interfaces (e.g., `ContainerPool`, `Service`, `LanguageHandler`)
4. **Dependency Inversion**: Services depend on abstractions, not concrete implementations

### Language Handlers

All language-specific logic lives in `grader-engine-go/internal/grader/language/`:
- Interface: `language/interface.go` defines `LanguageHandler`
- Implementations: `cpp_handler.go`, `python_handler.go`, `java_handler.go`
- Registry: `registry.go` maps language strings to handlers

**Adding new languages**: Implement `LanguageHandler` interface, register in `registry.go`, no changes to core grader.

## Critical Development Workflows

### Local Development Mode (Hot Reload)

```bash
./dev.sh start     # Start all services with hot reload
./dev.sh logs      # Follow logs
./dev.sh stop      # Stop all
```

**Port mapping**:
- Frontend: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:5000 (Flask debug mode)
- Worker: http://localhost:8080 (Air hot reload)
- RabbitMQ UI: http://localhost:15672 (guest/guest)

**IMPORTANT**: First-time setup requires building the sandbox image:
```bash
docker build -t code-grader-project-sandbox:latest -f grader-engine-go/Dockerfile.sandbox grader-engine-go
```

### Database Migrations

Migrations run **automatically** on backend container startup (see `backend/startup.py`). For manual operations:

```bash
# Create new migration
docker exec -it code-grader-project-backend-1 flask db migrate -m "description"

# Apply migrations
docker exec -it code-grader-project-backend-1 flask db upgrade
```

### Running Backend Commands

```bash
# Seed database with test data
docker exec -it code-grader-project-backend-1 flask seed-test-data

# Generate API tokens
docker exec -it code-grader-project-backend-1 flask generate-tokens
```

### Testing Submission Flow

1. Use test accounts (seeded automatically):
   - Teacher: `teacher.test@example.com` / `password123`
   - Student: `student.test@example.com` / `password123`
2. Create problem with test cases
3. Submit code as student
4. Check `docker logs -f code-grader-project-worker-1` for grading process

## Project-Specific Conventions

### Authentication & Authorization

- **JWT tokens** for authentication (`flask_jwt_extended`)
- **Role-based access**: `@role_required('teacher')` or `@role_required('student')` decorators
- **Public tokens**: All API endpoints use opaque tokens (e.g., `/api/submissions/<token>`) - never expose internal IDs

### I18n Support

Backend supports **English/Vietnamese** via user preferences:
- User model has `language` field ('en' or 'vi')
- Use `@with_user_language` decorator to inject `g.language` into routes
- Problem/Class models have `title_vi`, `description_vi` fields for translations
- Frontend uses `react-i18next` with locale files in `frontend-vite/public/locales/`

### Grading Modes

Two modes (determined by `problem.grading_mode` field):

1. **STDIO**: Standard input/output testing (most common)
   - Worker redirects stdin/stdout, compares output
   - Implementation: `grader-engine-go/internal/grader/structured.go`

2. **Function-based**: Direct function call testing
   - Worker generates test harness that calls function, parses output line-by-line
   - Implementation: Language-specific handlers (e.g., `cpp_handler.go`)
   - **Optimization**: Runs all test cases once, parses N output lines (see `AGENTS.md` - Applied Fixes)

### Error Handling

Backend uses custom exception classes (`backend/app/exceptions.py`):
- `NotFoundError`, `ValidationError`, `UnauthorizedError`, `ServiceUnavailableError`
- Global error handler in `backend/app/error_handlers.py` converts to JSON responses

### Container Pool Architecture

Worker maintains **reusable Docker containers** for performance:
- Interface: `grader-engine-go/internal/pool/interface.go`
- Implementation: `container_pool.go` with goroutine-safe operations
- Containers are cleaned between uses (files deleted, processes killed)
- Pool size configurable via environment variables

## Design Requirements

### Neo-Brutalism UI (Frontend)

**MUST** follow these principles (see `AGENTS.md` - Design Principles):
- **Borders**: 3-5px solid black on all interactive elements
- **Colors**: Bright saturated primaries (yellow, cyan, pink, lime) + black/white
- **Typography**: Bold sans-serif, large hierarchy
- **No gradients**: Flat backgrounds only
- **Sharp corners**: No border-radius
- **Bold shadows**: Offset shadows for depth (not blur)

Example components: Check `frontend-vite/src/components/` for reference implementations.

## Common Pitfalls

1. **Don't expose internal IDs**: Always use public tokens in API responses/URLs
2. **Don't modify core grader for new languages**: Use `LanguageHandler` interface
3. **Sandbox image must exist**: Worker fails if `code-grader-project-sandbox:latest` not built
4. **Language must match**: Submission language must match problem language (validated in `submission_routes.py`)
5. **RabbitMQ connection pooling**: Use `rabbitmq_pool.py` not direct `rabbitmq_producer.py` for production
6. **Docker socket required**: Worker needs `/var/run/docker.sock` mounted to manage containers

## File Locations Quick Reference

- **Route definitions**: `backend/app/routes/*_routes.py`
- **Database models**: `backend/app/models.py` (shared by backend and worker)
- **Grading logic**: `grader-engine-go/internal/grader/service.go`
- **Language handlers**: `grader-engine-go/internal/grader/language/`
- **Container pool**: `grader-engine-go/internal/pool/`
- **RabbitMQ**: `backend/app/rabbitmq_pool.py`, `grader-engine-go/internal/worker/worker.go`
- **API documentation**: Auto-generated Swagger at http://localhost:5000/api/docs

## Agent Workflow Guidelines

1. **Task Management**: Create todo list for multi-step tasks (use `manage_todo_list` tool)
2. **No Markdown Reports**: Never create `.md` files for summaries unless explicitly requested
3. **Code Review**: Review SOLID adherence after every feature/change
4. **Extensibility First**: Prefer refactoring over hacky fixes (see `AGENTS.md` - Fix Strategy)
5. **Test After Changes**: Use seeded test accounts to verify submission flow

## Environment Variables

Key variables in `.env` files:
- `DATABASE_URL`: PostgreSQL connection string (shared by backend/worker)
- `RABBITMQ_HOST`: RabbitMQ hostname (default: `rabbitmq` in Docker)
- `SECRET_KEY`: Flask JWT signing key
- `BACKEND_API_URL`: Worker needs this to call backend API for updates

Production uses `docker-compose.yml`, development uses `docker-compose.dev.yml` (hot reload enabled).
