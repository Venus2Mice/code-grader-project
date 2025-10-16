#!/bin/bash
# Script to run database migration for allowing NULL test_case_id

echo "🔄 Running database migration..."
echo "This will allow test_case_id to be NULL for compile errors"
echo ""

cd backend

# Run migration
docker compose exec backend flask db upgrade

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
else
    echo ""
    echo "❌ Migration failed!"
    exit 1
fi
