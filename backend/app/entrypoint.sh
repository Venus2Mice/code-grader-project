#!/bin/sh

# Đặt -e để script sẽ thoát ngay lập tức nếu có lỗi
set -e

echo "Waiting for PostgreSQL to be ready..."

# Vòng lặp đợi PostgreSQL. Sử dụng `pg_isready` là cách chuẩn.
# Biến DATABASE_URL có dạng postgresql://user:password@host:port/db
# Chúng ta cần trích xuất `host` và `port`.
# `cut` là công cụ mạnh mẽ để làm việc này.
DB_HOST=$(echo $DATABASE_URL | cut -d'@' -f2 | cut -d':' -f1)
DB_PORT=$(echo $DATABASE_URL | cut -d':' -f3 | cut -d'/' -f1)
DB_USER=$(echo $DATABASE_URL | cut -d':' -f2 | cut -d'/' -f3)

# Lệnh `until` sẽ chạy cho đến khi lệnh bên trong nó trả về exit code 0 (thành công)
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing commands"

# Áp dụng database migrations
echo "Applying database migrations..."
flask db upgrade

# Gieo mầm dữ liệu ban đầu
echo "Seeding initial data..."
flask seed_db

# Cuối cùng, thực thi lệnh chính của container (CMD trong Dockerfile)
# "$@" sẽ lấy tất cả các tham số truyền vào script và thực thi chúng
# Ví dụ: nếu CMD là ["flask", "run"], thì "$@" sẽ là "flask run"
exec "$@"