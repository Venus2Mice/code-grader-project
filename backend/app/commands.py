# /backend/app/commands.py

import click
from flask.cli import with_appcontext
from .models import Role, db, User, Class, Problem, TestCase

@click.command(name='seed_db')
@with_appcontext
def seed_db_command():
    """Tạo các vai trò ban đầu trong CSDL."""
    if Role.query.filter_by(name='teacher').first() is None:
        teacher_role = Role(name='teacher')
        db.session.add(teacher_role)
        print("Đã thêm vai trò 'teacher'.")

    if Role.query.filter_by(name='student').first() is None:
        student_role = Role(name='student')
        db.session.add(student_role)
        print("Đã thêm vai trò 'student'.")

    db.session.commit()
    print("CSDL đã được seed với các vai trò cơ bản!")

# --- Lệnh mới để seed dữ liệu test ---
@click.command(name='seed_test_data')
@with_appcontext
def seed_test_data_command():
    """Tạo dữ liệu mẫu hoàn chỉnh cho việc test (teacher, student, class, problem)."""
    
    # 0. Kiểm tra xem dữ liệu đã tồn tại chưa để tránh tạo trùng
    if User.query.filter_by(email='teacher.test@example.com').first():
        print("Dữ liệu test dường như đã tồn tại. Bỏ qua.")
        return

    # 1. Lấy các vai trò từ CSDL
    teacher_role = Role.query.filter_by(name='teacher').first()
    student_role = Role.query.filter_by(name='student').first()

    if not teacher_role or not student_role:
        print("Lỗi: Không tìm thấy vai trò 'teacher' hoặc 'student'.")
        print("Hãy chạy 'flask seed_db' trước.")
        return

    print("Bắt đầu tạo dữ liệu test...")

    # 2. Tạo một giáo viên mẫu
    teacher_user = User(
        full_name="Test Teacher",
        email="teacher.test@example.com",
        role_id=teacher_role.id
    )
    teacher_user.set_password("password123")
    
    # 3. Tạo một sinh viên mẫu
    student_user = User(
        full_name="Test Student",
        email="student.test@example.com",
        role_id=student_role.id
    )
    student_user.set_password("password123")

    # Lưu user vào CSDL để họ có ID
    db.session.add_all([teacher_user, student_user])
    db.session.commit()
    print(f"-> Đã tạo Teacher (ID: {teacher_user.id}) và Student (ID: {student_user.id}).")

    # 4. Giáo viên tạo một lớp học
    new_class = Class(
        name="Lớp Test C++",
        course_code="TEST101",
        teacher_id=teacher_user.id
    )
    db.session.add(new_class)
    db.session.commit()
    print(f"-> Đã tạo Class '{new_class.name}' (ID: {new_class.id}) với invite_code: {new_class.invite_code}.")

    # 5. Sinh viên tham gia vào lớp học đó
    new_class.students.append(student_user)
    db.session.commit()
    print(f"-> Student '{student_user.full_name}' đã tham gia lớp '{new_class.name}'.")

    # 6. Giáo viên tạo một bài tập trong lớp
    new_problem = Problem(
        title="Bài Test: Tổng hai số",
        description="Viết chương trình nhập vào 2 số nguyên a và b, in ra tổng của chúng.",
        class_id=new_class.id
    )
    
    # 7. Tạo các test case cho bài tập đó
    tc1 = TestCase(
        input_data="5 10",
        expected_output="15"
    )
    tc2 = TestCase(
        input_data="-1 -2",
        expected_output="-3"
    )
    new_problem.test_cases.append(tc1)
    new_problem.test_cases.append(tc2)

    db.session.add(new_problem)
    db.session.commit()
    print(f"-> Đã tạo Problem '{new_problem.title}' (ID: {new_problem.id}) với 2 test cases.")

    print("\nHoàn tất việc seed dữ liệu test!")
    print("--- Credentials ---")
    print("Teacher Email: teacher.test@example.com")
    print("Student Email: student.test@example.com")
    print("Password (cho cả hai): password123")
    print("-------------------")


def init_app(app):
    """Đăng ký các lệnh CLI với ứng dụng Flask."""
    app.cli.add_command(seed_db_command)
    app.cli.add_command(seed_test_data_command) # Thêm dòng này để đăng ký lệnh mới