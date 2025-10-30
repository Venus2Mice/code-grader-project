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
    print(f"✅ Đã tạo 2 Classes:")
    print(f"   - {class1.name} (ID: {class1.id}, Invite: {class1.invite_code})")
    print(f"   - {class2.name} (ID: {class2.id}, Invite: {class2.invite_code})")

    # 5. Students join classes (cross-enrollment)
    class1.students.extend([student1, student2])  # Alice & Bob in C++ class
    class2.students.extend([student1, student3])  # Alice & Charlie in Python class
    db.session.commit()
    print(f"✅ Students enrolled:")
    print(f"   - {student1.full_name}: Both classes")
    print(f"   - {student2.full_name}: C++ class only")
    print(f"   - {student3.full_name}: Python class only")

    # ============================================
    # PHASE 3: CREATE PROBLEMS - DIVERSE LANGUAGES
    # ============================================
    
    print("\n📝 Creating problems with diverse data types and languages...")
    
    # ========== PROBLEM 1: Python - Two Sum (Array + Integer) ==========
    problem1 = Problem(
        title="Two Sum",
        description="""Given an array of integers `nums` and an integer `target`, return the **indices** of the two numbers that add up to `target`.

You may assume that each input has **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.

**Example 1:**
```
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: nums[0] + nums[1] == 9, so we return [0, 1].
```

**Constraints:**
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.""",
        class_id=class2.id,
        language="python",
        difficulty="easy",
        function_signature="def twoSum(nums: List[int], target: int) -> List[int]:",
        time_limit_ms=2000,
        memory_limit_kb=131072,
        test_cases=[
            TestCase(
                inputs=[
                    {"type": "int[]", "value": [2, 7, 11, 15]},
                    {"type": "int", "value": 9}
                ],
                expected_output={"type": "int[]", "value": [0, 1]},
                points=30,
                is_hidden=False
            ),
            TestCase(
                inputs=[
                    {"type": "int[]", "value": [3, 2, 4]},
                    {"type": "int", "value": 6}
                ],
                expected_output={"type": "int[]", "value": [1, 2]},
                points=30,
                is_hidden=False
            ),
            TestCase(
                inputs=[
                    {"type": "int[]", "value": [3, 3]},
                    {"type": "int", "value": 6}
                ],
                expected_output={"type": "int[]", "value": [0, 1]},
                points=20,
                is_hidden=True
            ),
            # Edge case: Large numbers
            TestCase(
                inputs=[
                    {"type": "int[]", "value": [-1000000000, 1000000000, 500, -500]},
                    {"type": "int", "value": 0}
                ],
                expected_output={"type": "int[]", "value": [2, 3]},
                points=20,
                is_hidden=True
            )
        ]
    )
    db.session.add(problem1)
    db.session.commit()
    print(f"✅ Problem 1: {problem1.title} (Python, {len(problem1.test_cases)} test cases)")

    # ========== PROBLEM 2: C++ - Palindrome Number (Integer + Boolean) ==========
    problem2 = Problem(
        title="Palindrome Number",
        description="""Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.

An integer is a **palindrome** when it reads the same forward and backward.

**Example 1:**
```
Input: x = 121
Output: true
Explanation: 121 reads as 121 from left to right and from right to left.
```

**Example 2:**
```
Input: x = -121
Output: false
Explanation: From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.
```

**Constraints:**
- -2^31 <= x <= 2^31 - 1

**Follow up:** Could you solve it without converting the integer to a string?""",
        class_id=class1.id,
        language="cpp",
        difficulty="easy",
        function_signature="bool isPalindrome(int x);",
        time_limit_ms=1000,
        memory_limit_kb=65536,
        test_cases=[
            TestCase(
                inputs=[{"type": "int", "value": 121}],
                expected_output={"type": "bool", "value": True},
                points=20,
                is_hidden=False
            ),
            TestCase(
                inputs=[{"type": "int", "value": -121}],
                expected_output={"type": "bool", "value": False},
                points=20,
                is_hidden=False
            ),
            TestCase(
                inputs=[{"type": "int", "value": 10}],
                expected_output={"type": "bool", "value": False},
                points=20,
                is_hidden=False
            ),
            TestCase(
                inputs=[{"type": "int", "value": 0}],
                expected_output={"type": "bool", "value": True},
                points=20,
                is_hidden=True
            ),
            # Edge case: INT_MAX
            TestCase(
                inputs=[{"type": "int", "value": 2147483647}],
                expected_output={"type": "bool", "value": False},
                points=20,
                is_hidden=True
            )
        ]
    )
    db.session.add(problem2)
    db.session.commit()
    print(f"✅ Problem 2: {problem2.title} (C++, {len(problem2.test_cases)} test cases)")

    # ========== PROBLEM 3: Java - Reverse String (Char Array) ==========
    problem3 = Problem(
        title="Reverse String",
        description="""Write a function that reverses a string. The input string is given as an array of characters `s`.

You must do this by modifying the input array **in-place** with O(1) extra memory.

**Example 1:**
```
Input: s = ["h","e","l","l","o"]
Output: ["o","l","l","e","h"]
```

**Example 2:**
```
Input: s = ["H","a","n","n","a","h"]
Output: ["h","a","n","n","a","H"]
```

**Constraints:**
- 1 <= s.length <= 10^5
- s[i] is a printable ascii character.""",
        class_id=class1.id,
        language="java",
        difficulty="easy",
        function_signature="public void reverseString(char[] s);",
        time_limit_ms=1500,
        memory_limit_kb=131072,
        test_cases=[
            TestCase(
                inputs=[{"type": "char[]", "value": ["h", "e", "l", "l", "o"]}],
                expected_output={"type": "char[]", "value": ["o", "l", "l", "e", "h"]},
                points=30,
                is_hidden=False
            ),
            TestCase(
                inputs=[{"type": "char[]", "value": ["H", "a", "n", "n", "a", "h"]}],
                expected_output={"type": "char[]", "value": ["h", "a", "n", "n", "a", "H"]},
                points=30,
                is_hidden=False
            ),
            # Edge case: Single character
            TestCase(
                inputs=[{"type": "char[]", "value": ["A"]}],
                expected_output={"type": "char[]", "value": ["A"]},
                points=20,
                is_hidden=True
            ),
            # Edge case: Empty array
            TestCase(
                inputs=[{"type": "char[]", "value": []}],
                expected_output={"type": "char[]", "value": []},
                points=20,
                is_hidden=True
            )
        ]
    )
    db.session.add(problem3)
    db.session.commit()
    print(f"✅ Problem 3: {problem3.title} (Java, {len(problem3.test_cases)} test cases)")

    # ========== PROBLEM 4: Python - Rotate Matrix (2D Array) ==========
    problem4 = Problem(
        title="Rotate Image",
        description="""You are given an n x n 2D matrix representing an image, rotate the image by **90 degrees** (clockwise).

You have to rotate the image **in-place**, which means you have to modify the input 2D matrix directly. 
**DO NOT** allocate another 2D matrix and do the rotation.

**Example 1:**
```
Input: matrix = [[1,2,3],[4,5,6],[7,8,9]]
Output: [[7,4,1],[8,5,2],[9,6,3]]
```

**Example 2:**
```
Input: matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]
Output: [[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]
```

**Constraints:**
- n == matrix.length == matrix[i].length
- 1 <= n <= 20
- -1000 <= matrix[i][j] <= 1000""",
        class_id=class2.id,
        language="python",
        difficulty="medium",
        function_signature="def rotate(matrix: List[List[int]]) -> None:",
        time_limit_ms=2000,
        memory_limit_kb=131072,
        test_cases=[
            TestCase(
                inputs=[{"type": "int[][]", "value": [[1,2,3],[4,5,6],[7,8,9]]}],
                expected_output={"type": "int[][]", "value": [[7,4,1],[8,5,2],[9,6,3]]},
                points=30,
                is_hidden=False
            ),
            TestCase(
                inputs=[{"type": "int[][]", "value": [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]}],
                expected_output={"type": "int[][]", "value": [[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]},
                points=30,
                is_hidden=False
            ),
            # Edge case: 2x2 matrix
            TestCase(
                inputs=[{"type": "int[][]", "value": [[1,2],[3,4]]}],
                expected_output={"type": "int[][]", "value": [[3,1],[4,2]]},
                points=20,
                is_hidden=False
            ),
            # Edge case: 1x1 matrix
            TestCase(
                inputs=[{"type": "int[][]", "value": [[1]]}],
                expected_output={"type": "int[][]", "value": [[1]]},
                points=20,
                is_hidden=True
            )
        ]
    )
    db.session.add(problem4)
    db.session.commit()
    print(f"✅ Problem 4: {problem4.title} (Python, Matrix, {len(problem4.test_cases)} test cases)")

    # ========== PROBLEM 5: C++ - Valid Anagram (String) ==========
    problem5 = Problem(
        title="Valid Anagram",
        description="""Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, 
typically using all the original letters exactly once.

**Example 1:**
```
Input: s = "anagram", t = "nagaram"
Output: true
```

**Example 2:**
```
Input: s = "rat", t = "car"
Output: false
```

**Constraints:**
- 1 <= s.length, t.length <= 5 * 10^4
- s and t consist of lowercase English letters.

**Follow up:** What if the inputs contain Unicode characters?""",
        class_id=class1.id,
        language="cpp",
        difficulty="easy",
        function_signature="bool isAnagram(string s, string t);",
        time_limit_ms=1000,
        memory_limit_kb=65536,
        test_cases=[
            TestCase(
                inputs=[
                    {"type": "string", "value": "anagram"},
                    {"type": "string", "value": "nagaram"}
                ],
                expected_output={"type": "bool", "value": True},
                points=30,
                is_hidden=False
            ),
            TestCase(
                inputs=[
                    {"type": "string", "value": "rat"},
                    {"type": "string", "value": "car"}
                ],
                expected_output={"type": "bool", "value": False},
                points=30,
                is_hidden=False
            ),
            # Edge case: Empty strings
            TestCase(
                inputs=[
                    {"type": "string", "value": ""},
                    {"type": "string", "value": ""}
                ],
                expected_output={"type": "bool", "value": True},
                points=20,
                is_hidden=True
            ),
            # Edge case: Different lengths
            TestCase(
                inputs=[
                    {"type": "string", "value": "a"},
                    {"type": "string", "value": "ab"}
                ],
                expected_output={"type": "bool", "value": False},
                points=20,
                is_hidden=True
            )
        ]
    )
    db.session.add(problem5)
    db.session.commit()
    print(f"✅ Problem 5: {problem5.title} (C++, String, {len(problem5.test_cases)} test cases)")

    # ========== PROBLEM 6: Python - Fibonacci (Performance Test) ==========
    problem6 = Problem(
        title="Fibonacci Number",
        description="""The **Fibonacci numbers**, commonly denoted F(n) form a sequence, called the Fibonacci sequence, 
such that each number is the sum of the two preceding ones, starting from 0 and 1. That is,

```
F(0) = 0, F(1) = 1
F(n) = F(n - 1) + F(n - 2), for n > 1.
```

Given `n`, calculate `F(n)`.

**Example 1:**
```
Input: n = 2
Output: 1
Explanation: F(2) = F(1) + F(0) = 1 + 0 = 1.
```

**Example 2:**
```
Input: n = 4
Output: 3
Explanation: F(4) = F(3) + F(2) = 2 + 1 = 3.
```

**Constraints:**
- 0 <= n <= 30

**Note:** Your solution must be efficient. Exponential time complexity will result in Time Limit Exceeded.""",
        class_id=class2.id,
        language="python",
        difficulty="easy",
        function_signature="def fib(n: int) -> int:",
        time_limit_ms=500,  # Strict time limit to force efficient solution
        memory_limit_kb=65536,
        test_cases=[
            TestCase(
                inputs=[{"type": "int", "value": 2}],
                expected_output={"type": "int", "value": 1},
                points=15,
                is_hidden=False
            ),
            TestCase(
                inputs=[{"type": "int", "value": 4}],
                expected_output={"type": "int", "value": 3},
                points=15,
                is_hidden=False
            ),
            TestCase(
                inputs=[{"type": "int", "value": 10}],
                expected_output={"type": "int", "value": 55},
                points=20,
                is_hidden=False
            ),
            # Performance test case
            TestCase(
                inputs=[{"type": "int", "value": 30}],
                expected_output={"type": "int", "value": 832040},
                points=30,
                is_hidden=True
            ),
            # Edge case: n=0
            TestCase(
                inputs=[{"type": "int", "value": 0}],
                expected_output={"type": "int", "value": 0},
                points=20,
                is_hidden=True
            )
        ]
    )
    db.session.add(problem6)
    db.session.commit()
    print(f"✅ Problem 6: {problem6.title} (Python, Performance, {len(problem6.test_cases)} test cases)")

    # ========== PROBLEM 7: C++ - Container With Most Water (Language Limits Test) ==========
    problem7 = Problem(
        title="Container With Most Water",
        description="""You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that 
the two endpoints of the i-th line are (i, 0) and (i, height[i]).

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.

**Notice** that you may not slant the container.

**Example 1:**
```
Input: height = [1,8,6,2,5,4,8,3,7]
Output: 49
Explanation: The vertical lines at indices 1 and 8 form the container with max area = 49.
```

**Example 2:**
```
Input: height = [1,1]
Output: 1
```

**Constraints:**
- n == height.length
- 2 <= n <= 10^5
- 0 <= height[i] <= 10^4""",
        class_id=class1.id,
        language="cpp",
        difficulty="medium",
        function_signature="int maxArea(vector<int>& height);",
        time_limit_ms=1000,
        memory_limit_kb=65536,
        language_limits={
            "cpp": {"timeMs": 1000, "memoryKb": 65536},
            "python": {"timeMs": 3000, "memoryKb": 131072},
            "java": {"timeMs": 2000, "memoryKb": 131072}
        },
        test_cases=[
            TestCase(
                inputs=[{"type": "int[]", "value": [1,8,6,2,5,4,8,3,7]}],
                expected_output={"type": "int", "value": 49},
                points=40,
                is_hidden=False
            ),
            TestCase(
                inputs=[{"type": "int[]", "value": [1,1]}],
                expected_output={"type": "int", "value": 1},
                points=30,
                is_hidden=False
            ),
            # Edge case: Large array
            TestCase(
                inputs=[{"type": "int[]", "value": [1,2,4,3]*250}],  # 1000 elements
                expected_output={"type": "int", "value": 996},
                points=30,
                is_hidden=True
            )
        ]
    )
    db.session.add(problem7)
    db.session.commit()
    print(f"✅ Problem 7: {problem7.title} (C++, Multi-language limits, {len(problem7.test_cases)} test cases)")

    print("\n" + "="*60)
    print("✅ HOÀN TẤT VIỆC SEED DỮ LIỆU TEST!")
    print("="*60)
    print("\n📧 CREDENTIALS:")
    print("-" * 60)
    print("Teacher:")
    print(f"  Email: {teacher_user.email}")
    print(f"  Password: password123")
    print("\nStudents:")
    print(f"  Alice: {student1.email} / password123")
    print(f"  Bob: {student2.email} / password123")
    print(f"  Charlie: {student3.email} / password123")
    print("-" * 60)
    
    print("\n📚 CLASSES:")
    print("-" * 60)
    print(f"Class 1: {class1.name}")
    print(f"  Code: {class1.course_code} | Invite: {class1.invite_code}")
    print(f"  Students: Alice, Bob")
    print(f"\nClass 2: {class2.name}")
    print(f"  Code: {class2.course_code} | Invite: {class2.invite_code}")
    print(f"  Students: Alice, Charlie")
    print("-" * 60)
    
    print("\n📝 PROBLEMS SUMMARY:")
    print("-" * 60)
    problems = [problem1, problem2, problem3, problem4, problem5, problem6, problem7]
    
    # Calculate statistics
    total_test_cases = sum(len(p.test_cases) for p in problems)
    total_public = sum(sum(1 for tc in p.test_cases if not tc.is_hidden) for p in problems)
    total_hidden = sum(sum(1 for tc in p.test_cases if tc.is_hidden) for p in problems)
    total_points = sum(sum(tc.points for tc in p.test_cases) for p in problems)
    
    for i, p in enumerate(problems, 1):
        public_count = sum(1 for tc in p.test_cases if not tc.is_hidden)
        hidden_count = sum(1 for tc in p.test_cases if tc.is_hidden)
        problem_points = sum(tc.points for tc in p.test_cases)
        print(f"{i}. {p.title}")
        print(f"   Language: {p.language.upper()} | Difficulty: {p.difficulty} | Total: {problem_points} points")
        print(f"   Test Cases: {len(p.test_cases)} ({public_count} public, {hidden_count} hidden)")
        print(f"   Class: {p.class_obj.name}")
    print("-" * 60)
    
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