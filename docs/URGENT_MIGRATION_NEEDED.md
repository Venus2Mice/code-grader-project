# ⚠️ CẢNH BÁO: CẦN TẠO MIGRATION MỚI

## 🚨 VẤN ĐỀ QUAN TRỌNG

**Models.py đã có các trường mới NHƯNG chưa tạo migration!**

Hiện tại database trong production KHÔNG có các trường này:
- `Problem.difficulty`
- `Problem.grading_mode`
- `Problem.function_signature`
- `TestCase.points`
- `Class.description`

## 📋 HÀNH ĐỘNG CẦN LÀM NGAY

### 1. Tạo Migration Mới

```bash
cd /workspaces/code-grader-project/backend

# Tạo migration file mới
flask db revision -m "add_frontend_required_fields"
```

### 2. File Migration Sẽ Tạo

File sẽ được tạo tại: `backend/migrations/versions/XXXXX_add_frontend_required_fields.py`

Nội dung cần có:

```python
def upgrade():
    # Thêm vào bảng classes
    op.add_column('classes', sa.Column('description', sa.Text(), nullable=True))
    
    # Thêm vào bảng problems
    op.add_column('problems', sa.Column('difficulty', sa.String(length=20), nullable=True))
    op.add_column('problems', sa.Column('grading_mode', sa.String(length=20), nullable=True))
    op.add_column('problems', sa.Column('function_signature', sa.Text(), nullable=True))
    
    # Thêm vào bảng test_cases
    op.add_column('test_cases', sa.Column('points', sa.Integer(), nullable=True))
    
    # Set default values cho các bản ghi hiện tại
    op.execute("UPDATE problems SET difficulty = 'medium' WHERE difficulty IS NULL")
    op.execute("UPDATE problems SET grading_mode = 'stdio' WHERE grading_mode IS NULL")
    op.execute("UPDATE test_cases SET points = 10 WHERE points IS NULL")

def downgrade():
    # Xóa các columns nếu rollback
    op.drop_column('test_cases', 'points')
    op.drop_column('problems', 'function_signature')
    op.drop_column('problems', 'grading_mode')
    op.drop_column('problems', 'difficulty')
    op.drop_column('classes', 'description')
```

### 3. Chạy Migration

```bash
# Apply migration
flask db upgrade

# Kiểm tra
flask db current
```

### 4. Restart Services

```bash
# Restart backend
docker-compose restart backend

# Restart worker nếu cần
./scripts/run_worker.sh
```

## 🔍 KIỂM TRA

Sau khi chạy migration, kiểm tra:

```bash
# Vào PostgreSQL
docker exec -it code-grader-project-db-1 psql -U postgres -d code_grader

# Kiểm tra schema
\d problems
\d test_cases
\d classes

# Thoát
\q
```

Phải thấy các columns mới:
- `problems` table: `difficulty`, `grading_mode`, `function_signature`
- `test_cases` table: `points`
- `classes` table: `description`

## ⚠️ CHÚ Ý

**KHÔNG deploy production nếu chưa chạy migration này!**

Frontend sẽ gửi các fields mới nhưng backend database không có columns để lưu → **LỖI 500!**

## 📝 CHECKLIST

- [ ] Tạo migration file
- [ ] Review migration code
- [ ] Test trên local database
- [ ] Backup production database
- [ ] Chạy migration trên production
- [ ] Verify columns đã tạo
- [ ] Test create problem với các fields mới
- [ ] Monitor logs for errors

## 🎯 SAU KHI HOÀN THÀNH

Migration này sẽ giúp:
- ✅ Frontend có thể lưu difficulty, grading_mode cho problems
- ✅ Test cases có điểm số riêng
- ✅ Classes có mô tả chi tiết
- ✅ System hoàn toàn đồng bộ frontend-backend

**Priority: 🔴 CRITICAL - Cần làm trước khi deploy/test đầy đủ!**
