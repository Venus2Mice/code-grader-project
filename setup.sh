#!/bin/bash

# ==============================================================================
# ==        FINAL "FIRE-AND-FORGET" SETUP SCRIPT FOR CODE GRADER            ==
# ==============================================================================
#
# This script fully automates the setup and launch process in one terminal.
# 1. Starts core services in the background.
# 2. Fully configures the database, including test data.
# 3. Takes over the current terminal to run the worker, showing its live logs.
#
# ==============================================================================

# --- Helper Functions for Colored Output ---
Color_Off='\033[0m'
BGreen='\033[1;32m'
BYellow='\033[1;33m'
BRed='\033[1;31m'

function print_success { echo -e "${BGreen}✓ $1${Color_Off}"; }
function print_info { echo -e "${BYellow}INFO: $1${Color_Off}"; }
function print_error_and_exit { echo -e "${BRed}ERROR: $1${Color_Off}"; exit 1; }

# --- Main Script ---
set -e

# --- 1. Prerequisites Check ---
print_info "Checking prerequisites..."
if ! command -v docker &> /dev/null; then print_error_and_exit "Docker not found."; fi
if docker compose version &> /dev/null; then COMPOSE_CMD="docker compose"; elif command -v docker-compose &> /dev/null; then COMPOSE_CMD="docker-compose"; else print_error_and_exit "Docker Compose not found."; fi
print_success "Found Docker Compose: '$COMPOSE_CMD'"
if [[ "$(uname)" == "Linux" ]] && ! docker info &> /dev/null; then print_error_and_exit "Docker permission error. Run 'sudo usermod -aG docker \$USER' and relogin."; fi
print_success "Docker permissions OK."
if command -v python3 &> /dev/null; then PYTHON_CMD="python3"; elif command -v python &> /dev/null; then PYTHON_CMD="python"; else print_error_and_exit "Python 3 not found."; fi
print_success "Found Python: '$PYTHON_CMD'"
if [ ! -f .env ]; then print_error_and_exit "The '.env' configuration file is missing."; fi
print_success "Found '.env' file."

# --- Create the full command with the --env-file flag ---
COMPOSE_CMD_WITH_ENV="$COMPOSE_CMD --env-file ./.env"

# --- 1. Clean Up Previous Environment ---
print_info "Tearing down any existing services and DELETING ALL DATA VOLUMES for a clean start..."
$COMPOSE_CMD_WITH_ENV down -v
print_success "Cleanup complete."

# --- 2. Start Core Services in Background ---
print_info "Starting core services (PostgreSQL, RabbitMQ, Backend) in the background..."
$COMPOSE_CMD_WITH_ENV up --build -d
print_success "Core services are running."

# --- 3. Wait for PostgreSQL ---
DB_USER=$(grep POSTGRES_USER .env | cut -d '=' -f2)
print_info "Waiting for PostgreSQL to be ready..."
for i in {1..20}; do
    if $COMPOSE_CMD_WITH_ENV exec -T postgres pg_isready -h postgres -U "$DB_USER" -d "code_grader_db" &> /dev/null; then DB_READY=true; break; fi
    echo -n "."; sleep 2
done
echo
if [ -z "$DB_READY" ]; then print_error_and_exit "PostgreSQL timed out. Check logs: '$COMPOSE_CMD_WITH_ENV logs postgres'"; fi
print_success "PostgreSQL is ready."


# --- 4. Fully Configure Database ---
print_info "Setting up the database..."
rm -rf backend/migrations/
$COMPOSE_CMD_WITH_ENV exec backend flask db init > /dev/null # Redirect output for cleaner logs
$COMPOSE_CMD_WITH_ENV exec backend flask db migrate -m "Initial setup migration"
$COMPOSE_CMD_WITH_ENV exec backend flask db upgrade
$COMPOSE_CMD_WITH_ENV exec backend flask seed_db
$COMPOSE_CMD_WITH_ENV exec backend flask seed_test_data # Chạy lệnh seed test data mới
print_success "Database is fully configured and seeded with test data."


# --- 5. Prepare Worker Environment ---
print_info "Setting up Python virtual environment for the worker..."
cd grader-engine
if [ ! -d "venv" ]; then $PYTHON_CMD -m venv venv; fi
source venv/bin/activate
pip install -q -r requirements.txt
deactivate
cd ..
print_success "Worker environment is ready."


# --- 6. Final Step: Launch Worker in this Terminal ---
echo
echo -e "${BGreen}=======================================================================${Color_Off}"
echo -e "${BGreen}==           SETUP COMPLETE. ALL SYSTEMS ARE GO!                   ==${Color_Off}"
echo -e "${BGreen}=======================================================================${Color_Off}"
echo
echo -e "Backend API is available at: ${BYellow}http://localhost:5000/api/docs${Color_Off}"
echo -e "Test accounts created:"
echo -e "  - Teacher: ${BYellow}teacher.dev@example.com${Color_Off} / password: ${BYellow}password${Color_Off}"
echo -e "  - Student: ${BYellow}student.dev@example.com${Color_Off} / password: ${BYellow}password${Color_Off}"
echo
echo -e "${BRed}This terminal will now be used by the Worker.${Color_Off}"
print_info "Starting the worker... (Press Ctrl+C to stop)"
echo "-----------------------------------------------------------------------"

# Chạy worker như là lệnh cuối cùng của script
# Nó sẽ chiếm lấy terminal này cho đến khi bạn nhấn Ctrl+C
cd grader-engine
source venv/bin/activate
python run_worker.py