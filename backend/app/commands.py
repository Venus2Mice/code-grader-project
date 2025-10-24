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

    # 6. Giáo viên tạo các bài tập LeetCode-style (với function signature)
    
    # Problem 1: Python - Two Sum
    problem1 = Problem(
        title="Two Sum",
        description="Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.\nYou may assume that each input has exactly one solution, and you may not use the same element twice.",
        class_id=new_class.id,
        function_signature="def twoSum(nums: List[int], target: int) -> List[int]:",
        test_cases=[
            TestCase(
                inputs=[
                    {"type": "int[]", "value": [2, 7, 11, 15]},
                    {"type": "int", "value": 9}
                ],
                expected_output={"type": "int[]", "value": [0, 1]},
                points=10,
                is_hidden=False
            ),
            TestCase(
                inputs=[
                    {"type": "int[]", "value": [3, 2, 4]},
                    {"type": "int", "value": 6}
                ],
                expected_output={"type": "int[]", "value": [1, 2]},
                points=10,
                is_hidden=False
            ),
            TestCase(
                inputs=[
                    {"type": "int[]", "value": [3, 3]},
                    {"type": "int", "value": 6}
                ],
                expected_output={"type": "int[]", "value": [0, 1]},
                points=10,
                is_hidden=True
            )
        ]
    )
    db.session.add(problem1)
    db.session.commit()
    print(f"-> Đã tạo Problem '{problem1.title}' (ID: {problem1.id}) - Python - 3 test cases.")

    # Problem 2: C++ - Palindrome Number
    problem2 = Problem(
        title="Palindrome Number",
        description="Given an integer x, return true if x is a palindrome, and false otherwise.",
        class_id=new_class.id,
        function_signature="def isPalindrome(x: int) -> bool:",
        test_cases=[
            TestCase(
                inputs=[{"type": "int", "value": 121}],
                expected_output={"type": "bool", "value": True},
                points=10,
                is_hidden=False
            ),
            TestCase(
                inputs=[{"type": "int", "value": -121}],
                expected_output={"type": "bool", "value": False},
                points=10,
                is_hidden=False
            ),
            TestCase(
                inputs=[{"type": "int", "value": 10}],
                expected_output={"type": "bool", "value": False},
                points=10,
                is_hidden=False
            ),
            TestCase(
                inputs=[{"type": "int", "value": 0}],
                expected_output={"type": "bool", "value": True},
                points=10,
                is_hidden=True
            )
        ]
    )
    db.session.add(problem2)
    db.session.commit()
    print(f"-> Đã tạo Problem '{problem2.title}' (ID: {problem2.id}) - C++ - 4 test cases.")

    # Problem 3: Java - Reverse String
    problem3 = Problem(
        title="Reverse String",
        description="Write a function that reverses a string. The input string is given as an array of characters s.",
        class_id=new_class.id,
        function_signature="def reverseString(s: List[str]) -> List[str]:",
        test_cases=[
            TestCase(
                inputs=[{"type": "char[]", "value": ["h", "e", "l", "l", "o"]}],
                expected_output={"type": "char[]", "value": ["o", "l", "l", "e", "h"]},
                points=10,
                is_hidden=False
            ),
            TestCase(
                inputs=[{"type": "char[]", "value": ["H", "a", "n", "n", "a", "h"]}],
                expected_output={"type": "char[]", "value": ["h", "a", "n", "n", "a", "H"]},
                points=10,
                is_hidden=False
            )
        ]
    )
    db.session.add(problem3)
    db.session.commit()
    print(f"-> Đã tạo Problem '{problem3.title}' (ID: {problem3.id}) - Java - 2 test cases.")

    print("\n✅ Hoàn tất việc seed dữ liệu test với format LeetCode-style!")
    print("--- Credentials ---")
    print("Teacher Email: teacher.test@example.com")
    print("Student Email: student.test@example.com")
    print("Password (cho cả hai): password123")
    print("-------------------")
    print(f"📚 Class: Lớp Test C++ (ID: {new_class.id}, Invite Code: {new_class.invite_code})")
    print(f"📝 Problems: {len([problem1, problem2, problem3])} bài tập LeetCode-style")


@click.command(name='cleanup_test_submissions')
@with_appcontext
def cleanup_test_submissions_command():
    """Xóa các test submissions cũ (is_test=True)."""
    from .cleanup_service import cleanup_old_test_submissions
    
    count = cleanup_old_test_submissions(hours=1)
    print(f"✅ Cleaned up {count} old test submissions")


def init_app(app):
    """Đăng ký các lệnh CLI với ứng dụng Flask."""
    app.cli.add_command(seed_db_command)
    app.cli.add_command(seed_test_data_command)
    app.cli.add_command(cleanup_test_submissions_command)