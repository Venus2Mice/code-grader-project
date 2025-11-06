"""Seed test data: users, classes, and problems."""

import click
from flask.cli import with_appcontext
from ..models import Role, db, User, Class


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

    # ============================================
    # PHASE 1: CREATE USERS
    # ============================================
    
    # 2. Tạo giáo viên
    teacher_user = User(
        full_name="Test Teacher",
        email="teacher.test@example.com",
        role_id=teacher_role.id
    )
    teacher_user.set_password("password123")
    
    # 3. Tạo nhiều sinh viên để test multi-user scenarios
    student1 = User(
        full_name="Alice Student",
        email="alice.student@example.com",
        role_id=student_role.id
    )
    student1.set_password("password123")
    
    student2 = User(
        full_name="Bob Student", 
        email="bob.student@example.com",
        role_id=student_role.id
    )
    student2.set_password("password123")
    
    student3 = User(
        full_name="Charlie Student",
        email="charlie.student@example.com",
        role_id=student_role.id
    )
    student3.set_password("password123")

    # Lưu users vào CSDL để họ có ID
    db.session.add_all([teacher_user, student1, student2, student3])
    db.session.commit()
    print(f"✅ Đã tạo Teacher (ID: {teacher_user.id}) và 3 Students (IDs: {student1.id}, {student2.id}, {student3.id})")

    # ============================================
    # PHASE 2: CREATE CLASSES
    # ============================================
    
    # 4. Tạo 2 classes để test multi-class scenarios
    class1 = Class(
        name="Advanced Algorithms (C++)",
        course_code="CS301",
        description="Advanced data structures and algorithms using C++. Focus on performance optimization.",
        teacher_id=teacher_user.id
    )
    
    class2 = Class(
        name="Python Programming Fundamentals",
        course_code="CS101",
        description="Introduction to programming with Python. Covers basic syntax, data types, and problem-solving.",
        teacher_id=teacher_user.id
    )
    
    db.session.add_all([class1, class2])
    db.session.commit()
    
    # CRITICAL: Generate public tokens for classes (needed for frontend routing)
    from ..services.token_service import generate_class_token
    class1.public_token = generate_class_token(class1.id)
    class2.public_token = generate_class_token(class2.id)
    db.session.commit()
    
    print(f"✅ Đã tạo 2 Classes:")
    print(f"   - {class1.name} (ID: {class1.id}, Token: {class1.public_token}, Invite: {class1.invite_code})")
    print(f"   - {class2.name} (ID: {class2.id}, Token: {class2.public_token}, Invite: {class2.invite_code})")

    # 5. Students join classes (cross-enrollment)
    class1.students.extend([student1, student2])  # Alice & Bob in C++ class
    class2.students.extend([student1, student3])  # Alice & Charlie in Python class
    db.session.commit()
    print(f"✅ Students enrolled:")
    print(f"   - {student1.full_name}: Both classes")
    print(f"   - {student2.full_name}: C++ class only")
    print(f"   - {student3.full_name}: Python class only")

    # ============================================
    # PHASE 3: CREATE PROBLEMS
    # ============================================
    
    print("\n📝 Creating problems with diverse data types and languages...")
    
    from .problem_templates import (
        create_two_sum,
        create_palindrome_number,
        create_reverse_string,
        create_rotate_image,
        create_valid_anagram,
        create_fibonacci,
        create_container_water,
        create_merge_sorted_arrays,
        create_longest_common_prefix
    )
    
    # Python problems for CS101
    problem1 = create_two_sum(class2.id)
    problem4 = create_rotate_image(class2.id)
    problem6 = create_fibonacci(class2.id)
    problem8 = create_merge_sorted_arrays(class2.id)
    
    # C++ problems for CS301
    problem2 = create_palindrome_number(class1.id)
    problem5 = create_valid_anagram(class1.id)
    problem7 = create_container_water(class1.id)
    
    # Java problem for CS301
    problem3 = create_reverse_string(class1.id)
    problem9 = create_longest_common_prefix(class1.id)
    
    db.session.add_all([problem1, problem2, problem3, problem4, problem5, problem6, problem7, problem8, problem9])
    db.session.commit()
    
    # CRITICAL: Generate public tokens for problems (needed for frontend routing)
    from ..services.token_service import generate_problem_token
    problem1.public_token = generate_problem_token(problem1.id)
    problem2.public_token = generate_problem_token(problem2.id)
    problem3.public_token = generate_problem_token(problem3.id)
    problem4.public_token = generate_problem_token(problem4.id)
    problem5.public_token = generate_problem_token(problem5.id)
    problem6.public_token = generate_problem_token(problem6.id)
    problem7.public_token = generate_problem_token(problem7.id)
    problem8.public_token = generate_problem_token(problem8.id)
    problem9.public_token = generate_problem_token(problem9.id)
    db.session.commit()
    
    print(f"✅ Problem 1: {problem1.title} (Python, {len(problem1.test_cases)} test cases)")
    print(f"✅ Problem 2: {problem2.title} (C++, {len(problem2.test_cases)} test cases)")
    print(f"✅ Problem 3: {problem3.title} (Java, {len(problem3.test_cases)} test cases)")
    print(f"✅ Problem 4: {problem4.title} (Python, {len(problem4.test_cases)} test cases)")
    print(f"✅ Problem 5: {problem5.title} (C++, {len(problem5.test_cases)} test cases)")
    print(f"✅ Problem 6: {problem6.title} (Python, {len(problem6.test_cases)} test cases)")
    print(f"✅ Problem 7: {problem7.title} (C++, {len(problem7.test_cases)} test cases)")
    print(f"✅ Problem 8: {problem8.title} (Python, {len(problem8.test_cases)} test cases) - NEW")
    print(f"✅ Problem 9: {problem9.title} (Java, {len(problem9.test_cases)} test cases) - NEW")

    print("\n" + "="*60)
    print("✅ HOÀN TẤT VIỆC SEED DỮ LIỆU TEST!")
    print("="*60)
    
    _print_credentials(teacher_user, [student1, student2, student3])
    _print_classes([class1, class2], [student1, student2, student3])
    _print_problems_summary([problem1, problem2, problem3, problem4, problem5, problem6, problem7, problem8, problem9])


def _print_credentials(teacher, students):
    """Print login credentials."""
    print("\n📧 CREDENTIALS:")
    print("-" * 60)
    print("Teacher:")
    print(f"  Email: {teacher.email}")
    print(f"  Password: password123")
    print("\nStudents:")
    for student in students:
        print(f"  {student.full_name.split()[0]}: {student.email} / password123")
    print("-" * 60)


def _print_classes(classes, students):
    """Print class information."""
    print("\n📚 CLASSES:")
    print("-" * 60)
    for i, cls in enumerate(classes, 1):
        print(f"Class {i}: {cls.name}")
        print(f"  Code: {cls.course_code} | Invite: {cls.invite_code}")
        student_names = [s.full_name.split()[0] for s in cls.students]
        print(f"  Students: {', '.join(student_names)}")
        if i < len(classes):
            print()
    print("-" * 60)


def _print_problems_summary(problems):
    """Print problems statistics."""
    print("\n📝 PROBLEMS SUMMARY:")
    print("-" * 60)
    
    for i, p in enumerate(problems, 1):
        public_count = sum(1 for tc in p.test_cases if not tc.is_hidden)
        hidden_count = sum(1 for tc in p.test_cases if tc.is_hidden)
        problem_points = sum(tc.points for tc in p.test_cases)
        print(f"{i}. {p.title}")
        print(f"   Language: {p.language.upper()} | Difficulty: {p.difficulty} | Total: {problem_points} points")
        print(f"   Test Cases: {len(p.test_cases)} ({public_count} public, {hidden_count} hidden)")
        print(f"   Class: {p.class_obj.name}")
    print("-" * 60)
    
    # Calculate statistics
    total_test_cases = sum(len(p.test_cases) for p in problems)
    total_public = sum(sum(1 for tc in p.test_cases if not tc.is_hidden) for p in problems)
    total_hidden = sum(sum(1 for tc in p.test_cases if tc.is_hidden) for p in problems)
    total_points = sum(sum(tc.points for tc in p.test_cases) for p in problems)
    
    print("\n📊 TEST COVERAGE STATISTICS:")
    print("-" * 60)
    print(f"  Total Problems: {len(problems)}")
    print(f"  Total Test Cases: {total_test_cases}")
    print(f"  Public Test Cases: {total_public} ({total_public/total_test_cases*100:.1f}%)")
    print(f"  Hidden Test Cases: {total_hidden} ({total_hidden/total_test_cases*100:.1f}%)")
    print(f"  Total Points Available: {total_points}")
    print(f"  Average Points per Problem: {total_points/len(problems):.0f}")
    print("-" * 60)
    
    print("\n🎯 DATA TYPES COVERED:")
    print("  ✅ int, int[], int[][]")
    print("  ✅ bool")
    print("  ✅ string, char[]")
    print("  ✅ Performance testing (Fibonacci)")
    print("  ✅ Multi-language limits testing")
    print("  ✅ Edge cases (empty, large numbers, boundaries)")
    
    print("\n🌍 LANGUAGE DISTRIBUTION:")
    print("-" * 60)
    lang_count = {}
    for p in problems:
        lang_count[p.language] = lang_count.get(p.language, 0) + 1
    for lang, count in sorted(lang_count.items()):
        print(f"  {lang.upper()}: {count} problem(s)")
    print("-" * 60)
    print("\n" + "="*60)
