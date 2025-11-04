"""Seed test submissions with sample solutions."""

import click
from flask.cli import with_appcontext
from ..models import Problem, User, Role, db
from .. import rabbitmq_producer


@click.command(name='seed_test_submissions')
@with_appcontext
def seed_test_submissions_command():
    """Tạo test submissions cho tất cả các problems."""
    from ..models import Submission, SubmissionResult
    
    print("\n🚀 Creating test submissions for all problems...")
    print("="*60)
    
    # Lấy tất cả problems và students
    problems = Problem.query.all()
    students = User.query.filter_by(role_id=Role.query.filter_by(name='student').first().id).all()
    
    if not problems:
        print("❌ No problems found. Run 'flask seed_test_data' first.")
        return
    
    if not students:
        print("❌ No students found. Run 'flask seed_test_data' first.")
        return
    
    print(f"📝 Found {len(problems)} problems and {len(students)} students")
    print("-"*60)
    
    # Sample solutions cho mỗi problem (COMPLETE CODE WITH CLASS/FUNCTION)
    solutions = {
        "Two Sum": {
            "correct": """class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []""",
            "wrong": """class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Returns indices in wrong order
        for i in range(len(nums)):
            for j in range(i+1, len(nums)):
                if nums[i] + nums[j] == target:
                    return [j, i]  # Wrong order!
        return []""",
            "partial": """class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Only works for sorted arrays
        left, right = 0, len(nums) - 1
        while left < right:
            total = nums[left] + nums[right]
            if total == target:
                return [left, right]
            elif total < target:
                left += 1
            else:
                right -= 1
        return []"""
        },
        "Palindrome Number": {
            "correct": """#include <iostream>
#include <climits>
using namespace std;

class Solution {
public:
    bool isPalindrome(int x) {
        if (x < 0) return false;
        if (x < 10) return true;
        int reversed = 0, original = x;
        while (x > 0) {
            if (reversed > INT_MAX / 10 || (reversed == INT_MAX / 10 && x % 10 > 7)) return false;
            reversed = reversed * 10 + x % 10;
            x /= 10;
        }
        return original == reversed;
    }
};""",
            "wrong": """#include <iostream>
using namespace std;

class Solution {
public:
    bool isPalindrome(int x) {
        // Forgot to handle negative numbers
        int reversed = 0, original = x;
        while (x > 0) {
            reversed = reversed * 10 + x % 10;
            x /= 10;
        }
        return original == reversed;
    }
};""",
            "compile_error": """#include <iostream>
using namespace std;

class Solution {
public:
    bool isPalindrome(int x) {
        if x < 0:  # Python syntax in C++!
            return false
        return true
    }
};"""
        },
        "Reverse String": {
            "correct": """import java.util.*;

class Solution {
    public void reverseString(char[] s) {
        int left = 0, right = s.length - 1;
        while (left < right) {
            char temp = s[left];
            s[left] = s[right];
            s[right] = temp;
            left++;
            right--;
        }
    }
}""",
            "wrong": """import java.util.*;

class Solution {
    public void reverseString(char[] s) {
        // Creates new array instead of in-place
        char[] reversed = new char[s.length];
        for (int i = 0; i < s.length; i++) {
            reversed[i] = s[s.length - 1 - i];
        }
        // Doesn't modify s!
    }
}""",
            "runtime_error": """import java.util.*;

class Solution {
    public void reverseString(char[] s) {
        // Array index out of bounds
        for (int i = 0; i <= s.length; i++) {
            s[i] = s[s.length - 1 - i];
        }
    }
}"""
        },
        "Rotate Image": {
            "correct": """class Solution:
    def rotate(self, matrix: List[List[int]]) -> None:
        n = len(matrix)
        # Transpose
        for i in range(n):
            for j in range(i, n):
                matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
        # Reverse each row
        for i in range(n):
            matrix[i].reverse()""",
            "wrong": """class Solution:
    def rotate(self, matrix: List[List[int]]) -> None:
        # Only rotates, doesn't transpose correctly
        for row in matrix:
            row.reverse()""",
            "partial": """class Solution:
    def rotate(self, matrix: List[List[int]]) -> None:
        # Only works for 2x2 matrices
        if len(matrix) == 2:
            matrix[0][0], matrix[0][1], matrix[1][0], matrix[1][1] = matrix[1][0], matrix[0][0], matrix[1][1], matrix[0][1]"""
        },
        "Valid Anagram": {
            "correct": """#include <iostream>
#include <string>
#include <unordered_map>
using namespace std;

class Solution {
public:
    bool isAnagram(string s, string t) {
        if (s.length() != t.length()) return false;
        unordered_map<char, int> count;
        for (char c : s) count[c]++;
        for (char c : t) {
            if (--count[c] < 0) return false;
        }
        return true;
    }
};""",
            "wrong": """#include <iostream>
#include <string>
using namespace std;

class Solution {
public:
    bool isAnagram(string s, string t) {
        // Doesn't check character frequency correctly
        return s.length() == t.length();
    }
};""",
            "partial": """#include <iostream>
#include <string>
#include <algorithm>
using namespace std;

class Solution {
public:
    bool isAnagram(string s, string t) {
        // Only works for lowercase, but O(n log n)
        if (s.length() != t.length()) return false;
        sort(s.begin(), s.end());
        sort(t.begin(), t.end());
        return s == t;
    }
};"""
        },
        "Fibonacci Number": {
            "correct": """class Solution:
    def fib(self, n: int) -> int:
        if n <= 1:
            return n
        a, b = 0, 1
        for _ in range(2, n + 1):
            a, b = b, a + b
        return b""",
            "wrong": """class Solution:
    def fib(self, n: int) -> int:
        # Exponential time - will TLE
        if n <= 1:
            return n
        return self.fib(n - 1) + self.fib(n - 2)""",
            "tle": """class Solution:
    def fib(self, n: int) -> int:
        # Extremely slow - nested recursion
        if n == 0:
            return 0
        result = 0
        for i in range(n):
            result += self.fib(i)  # Recursive call in loop!
        return result"""
        },
        "Container With Most Water": {
            "correct": """#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxArea(vector<int>& height) {
        int maxArea = 0;
        int left = 0, right = height.size() - 1;
        while (left < right) {
            int h = min(height[left], height[right]);
            int width = right - left;
            maxArea = max(maxArea, h * width);
            if (height[left] < height[right]) {
                left++;
            } else {
                right--;
            }
        }
        return maxArea;
    }
};""",
            "wrong": """#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxArea(vector<int>& height) {
        // O(n^2) brute force - will TLE
        int maxArea = 0;
        for (int i = 0; i < height.size(); i++) {
            for (int j = i + 1; j < height.size(); j++) {
                int h = min(height[i], height[j]);
                int width = j - i;
                maxArea = max(maxArea, h * width);
            }
        }
        return maxArea;
    }
};""",
            "partial": """#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxArea(vector<int>& height) {
        // Only checks adjacent elements - wrong algorithm
        int maxArea = 0;
        for (int i = 0; i < height.size() - 1; i++) {
            int h = min(height[i], height[i+1]);
            maxArea = max(maxArea, h);
        }
        return maxArea;
    }
};"""
        }
    }

    submission_count = 0
    
    for problem in problems:
        print(f"\n📝 Problem: {problem.title} ({problem.language})")
        
        # Get corresponding solutions
        problem_solutions = solutions.get(problem.title, {})
        if not problem_solutions:
            print(f"  ⚠️  No sample solutions defined")
            continue
        
        # Create submissions for each student
        for i, student in enumerate(students):
            # Determine which solution type to use (rotate for variety)
            solution_types = list(problem_solutions.keys())
            solution_type = solution_types[i % len(solution_types)]
            source_code = problem_solutions[solution_type]
            
            # Create submission
            submission = Submission(
                problem_id=problem.id,
                student_id=student.id,
                source_code=source_code,
                language=problem.language,
                status='Pending',
                is_test=False  # Make these real submissions
            )
            db.session.add(submission)
            db.session.commit()
            
            # Publish to RabbitMQ for grading
            try:
                task_data = {"submission_id": submission.id}
                rabbitmq_producer.publish_task(task_data)
                submission_count += 1
                print(f"  ✅ {student.full_name}: Submission #{submission.id} ({solution_type}) - Published to queue")
            except Exception as e:
                print(f"  ❌ Failed to publish submission #{submission.id}: {str(e)}")
    
    print("\n" + "="*60)
    print(f"✅ Created {submission_count} test submissions!")
    print("="*60)
    
    print("\n🎯 NEXT STEPS:")
    print("1. Start Docker services: docker compose up -d")
    print("2. Watch submissions being graded by worker")
    print("3. Check results via API or frontend")
    
    print("\n📊 SUBMISSION DISTRIBUTION:")
    print(f"  Total: {submission_count} submissions")
    print(f"  Per Problem: ~{submission_count // len(problems)} submissions")
    print(f"  Per Student: ~{submission_count // len(students)} submissions")


