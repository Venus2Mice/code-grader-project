-- ============================================================================
-- TEST DATA FOR CODE GRADER PROJECT
-- ============================================================================

-- Clear existing data
TRUNCATE TABLE test_case_results CASCADE;
TRUNCATE TABLE submissions CASCADE;
TRUNCATE TABLE test_cases CASCADE;
TRUNCATE TABLE problems CASCADE;
TRUNCATE TABLE class_members CASCADE;
TRUNCATE TABLE classes CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE roles CASCADE;

-- 1. INSERT ROLES
INSERT INTO roles (id, name) VALUES 
(1, 'teacher'),
(2, 'student');

-- 2. INSERT USERS (TEACHERS)
INSERT INTO users (id, full_name, email, password_hash, role_id, created_at) VALUES
(1, 'Dr. Nguyễn Văn An', 'teacher1@example.com', 'pbkdf2:sha256:600000$abc123', 1, NOW()),
(2, 'Prof. Trần Thị Bình', 'teacher2@example.com', 'pbkdf2:sha256:600000$def456', 1, NOW());

-- 3. INSERT USERS (STUDENTS)
INSERT INTO users (id, full_name, email, password_hash, role_id, created_at) VALUES
(3, 'Nguyễn Minh Hoàng', 'student1@example.com', 'pbkdf2:sha256:600000$stu001', 2, NOW()),
(4, 'Lê Thị Thu Hà', 'student2@example.com', 'pbkdf2:sha256:600000$stu002', 2, NOW()),
(5, 'Phạm Văn Cường', 'student3@example.com', 'pbkdf2:sha256:600000$stu003', 2, NOW()),
(6, 'Vũ Thùy Dương', 'student4@example.com', 'pbkdf2:sha256:600000$stu004', 2, NOW());

-- 4. INSERT CLASSES
INSERT INTO classes (id, name, course_code, invite_code, teacher_id, created_at) VALUES
(1, 'Data Structures & Algorithms', 'CS101', 'DSA2025', 1, NOW()),
(2, 'Web Development with Python', 'CS201', 'WEB2025', 2, NOW());

-- 5. INSERT CLASS MEMBERS (Students)
INSERT INTO class_members (student_id, class_id) VALUES
(3, 1),
(4, 1),
(5, 1),
(6, 2),
(3, 2);

-- 6. INSERT PROBLEMS - PYTHON (Function-based)
INSERT INTO problems (id, class_id, title, description, difficulty, function_signature, language_limits, time_limit_ms, memory_limit_kb, created_at) VALUES
(1, 1, 'Two Sum', 'Given an array of integers nums and an integer target, return the indices of the two numbers that add up to the target.

You may assume that each input has exactly one solution, and you may not use the same element twice.

Example:
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
Explanation: nums[0] + nums[1] == 9', 
'medium', 'def twoSum(nums: List[int], target: int) -> List[int]:', 
'{"python": {"time_limit": 2000, "memory_limit": 128}, "java": {"time_limit": 2000, "memory_limit": 256}, "cpp": {"time_limit": 1000, "memory_limit": 128}}'::jsonb, 
1000, 256, NOW()),

(2, 1, 'Palindrome Number', 'Given an integer x, return true if x is a palindrome, and false otherwise.

Example 1:
Input: x = 121
Output: true

Example 2:
Input: x = -121
Output: false', 
'easy', 'def isPalindrome(x: int) -> bool:', 
'{"python": {"time_limit": 1000, "memory_limit": 128}, "java": {"time_limit": 1000, "memory_limit": 256}, "cpp": {"time_limit": 1000, "memory_limit": 128}}'::jsonb, 
1000, 128, NOW()),

(3, 1, 'Reverse String', 'Write a function that reverses a string. The input string is given as an array of characters s.

You must do this by modifying the input array in-place with O(1) extra memory.

Example:
Input: s = ["h","e","l","l","o"]
Output: ["o","l","l","e","h"]', 
'easy', 'def reverseString(s: List[str]) -> List[str]:', 
'{"python": {"time_limit": 1000, "memory_limit": 128}, "java": {"time_limit": 1000, "memory_limit": 256}, "cpp": {"time_limit": 1000, "memory_limit": 128}}'::jsonb, 
1000, 128, NOW());

-- 7. INSERT PROBLEMS - JAVA (Function-based)
INSERT INTO problems (id, class_id, title, description, difficulty, function_signature, language_limits, time_limit_ms, memory_limit_kb, created_at) VALUES
(4, 2, 'Valid Parentheses', 'Given a string s containing just the characters ''('', '')'', ''{}'', ''['', '']'', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.

Example 1:
Input: s = "()"
Output: true

Example 2:
Input: s = "()[]{}"
Output: true

Example 3:
Input: s = "(]"
Output: false', 
'easy', 'public boolean isValid(String s)', 
'{"python": {"time_limit": 1000, "memory_limit": 128}, "java": {"time_limit": 2000, "memory_limit": 256}, "cpp": {"time_limit": 1000, "memory_limit": 128}}'::jsonb, 
1000, 256, NOW());

-- 8. INSERT PROBLEMS - C++ (Function-based)
INSERT INTO problems (id, class_id, title, description, difficulty, function_signature, language_limits, time_limit_ms, memory_limit_kb, created_at) VALUES
(5, 2, 'Merge Sorted Arrays', 'You are given two integer arrays nums1 and nums2, sorted in non-decreasing order, and two integers m and n, representing the number of valid elements in nums1 and nums2 respectively.

Merge nums2 into nums1 as one sorted array.

Note: You may assume that nums1 has a length of m + n, so it has enough space to hold additional elements from nums2.

Example:
Input: nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3
Output: [1,2,2,3,5,6]', 
'easy', 'vector<int> merge(vector<int>& nums1, int m, vector<int>& nums2, int n)', 
'{"python": {"time_limit": 1000, "memory_limit": 128}, "java": {"time_limit": 2000, "memory_limit": 256}, "cpp": {"time_limit": 1000, "memory_limit": 128}}'::jsonb, 
1000, 128, NOW());

-- 9. INSERT TEST CASES for Two Sum (Problem 1)
INSERT INTO test_cases (id, problem_id, inputs, expected_output, is_hidden, points) VALUES
(1, 1, '[{"type": "int[]", "value": [2, 7, 11, 15]}, {"type": "int", "value": 9}]'::jsonb, '{"type": "int[]", "value": [0, 1]}'::jsonb, false, 25),
(2, 1, '[{"type": "int[]", "value": [3, 2, 4]}, {"type": "int", "value": 6}]'::jsonb, '{"type": "int[]", "value": [1, 2]}'::jsonb, false, 25),
(3, 1, '[{"type": "int[]", "value": [3, 3]}, {"type": "int", "value": 6}]'::jsonb, '{"type": "int[]", "value": [0, 1]}'::jsonb, false, 25),
(4, 1, '[{"type": "int[]", "value": [2, 7, 11, 15, 3, 6]}, {"type": "int", "value": 9}]'::jsonb, '{"type": "int[]", "value": [0, 1]}'::jsonb, true, 25);

-- 10. INSERT TEST CASES for Palindrome Number (Problem 2)
INSERT INTO test_cases (id, problem_id, inputs, expected_output, is_hidden, points) VALUES
(5, 2, '[{"type": "int", "value": 121}]'::jsonb, '{"type": "bool", "value": true}'::jsonb, false, 20),
(6, 2, '[{"type": "int", "value": -121}]'::jsonb, '{"type": "bool", "value": false}'::jsonb, false, 20),
(7, 2, '[{"type": "int", "value": 10}]'::jsonb, '{"type": "bool", "value": false}'::jsonb, false, 20),
(8, 2, '[{"type": "int", "value": 0}]'::jsonb, '{"type": "bool", "value": true}'::jsonb, false, 20),
(9, 2, '[{"type": "int", "value": 1001}]'::jsonb, '{"type": "bool", "value": true}'::jsonb, true, 20);

-- 11. INSERT TEST CASES for Reverse String (Problem 3)
INSERT INTO test_cases (id, problem_id, inputs, expected_output, is_hidden, points) VALUES
(10, 3, '[{"type": "string[]", "value": ["h","e","l","l","o"]}]'::jsonb, '{"type": "string[]", "value": ["o","l","l","e","h"]}'::jsonb, false, 33),
(11, 3, '[{"type": "string[]", "value": ["H","a","n","n","a","h"]}]'::jsonb, '{"type": "string[]", "value": ["h","a","n","n","a","H"]}'::jsonb, false, 33),
(12, 3, '[{"type": "string[]", "value": ["a"]}]'::jsonb, '{"type": "string[]", "value": ["a"]}'::jsonb, false, 34);

-- 12. INSERT TEST CASES for Valid Parentheses (Problem 4 - JAVA)
INSERT INTO test_cases (id, problem_id, inputs, expected_output, is_hidden, points) VALUES
(13, 4, '[{"type": "string", "value": "()"}]'::jsonb, '{"type": "bool", "value": true}'::jsonb, false, 25),
(14, 4, '[{"type": "string", "value": "()[]{}" }]'::jsonb, '{"type": "bool", "value": true}'::jsonb, false, 25),
(15, 4, '[{"type": "string", "value": "(]"}]'::jsonb, '{"type": "bool", "value": false}'::jsonb, false, 25),
(16, 4, '[{"type": "string", "value": "([{}])"}]'::jsonb, '{"type": "bool", "value": true}'::jsonb, true, 25);

-- 13. INSERT TEST CASES for Merge Sorted Arrays (Problem 5 - CPP)
INSERT INTO test_cases (id, problem_id, inputs, expected_output, is_hidden, points) VALUES
(17, 5, '[{"type": "int[]", "value": [1,2,3,0,0,0]}, {"type": "int", "value": 3}, {"type": "int[]", "value": [2,5,6]}, {"type": "int", "value": 3}]'::jsonb, '{"type": "int[]", "value": [1,2,2,3,5,6]}'::jsonb, false, 33),
(18, 5, '[{"type": "int[]", "value": [1]}, {"type": "int", "value": 1}, {"type": "int[]", "value": []}, {"type": "int", "value": 0}]'::jsonb, '{"type": "int[]", "value": [1]}'::jsonb, false, 33),
(19, 5, '[{"type": "int[]", "value": [0]}, {"type": "int", "value": 0}, {"type": "int[]", "value": [1]}, {"type": "int", "value": 1}]'::jsonb, '{"type": "int[]", "value": [0,1]}'::jsonb, true, 34);

-- 14. INSERT SUBMISSIONS - PYTHON
INSERT INTO submissions (id, student_id, problem_id, language, source_code, status, submitted_at, is_test) VALUES
(1, 3, 1, 'python', 
'def twoSum(nums: List[int], target: int) -> List[int]:
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []', 
'Accepted', NOW(), false),

(2, 4, 1, 'python', 
'def twoSum(nums: List[int], target: int) -> List[int]:
    seen = {}
    for i, num in enumerate(nums):
        if target - num in seen:
            return [seen[target - num], i]
        seen[num] = i
    return []', 
'Accepted', NOW(), false),

(3, 5, 2, 'python', 
'def isPalindrome(x: int) -> bool:
    if x < 0:
        return False
    return str(x) == str(x)[::-1]', 
'Accepted', NOW(), false),

(4, 3, 2, 'python', 
'def isPalindrome(x: int) -> bool:
    if x < 0 or (x % 10 == 0 and x != 0):
        return False
    reversed_half = 0
    while x > reversed_half:
        reversed_half = reversed_half * 10 + x % 10
        x //= 10
    return x == reversed_half or x == reversed_half // 10', 
'Accepted', NOW(), false),

(5, 6, 3, 'python', 
'def reverseString(s: List[str]) -> List[str]:
    return s[::-1]', 
'Accepted', NOW(), false);

-- 15. INSERT SUBMISSIONS - JAVA
INSERT INTO submissions (id, student_id, problem_id, language, source_code, status, submitted_at, is_test) VALUES
(6, 3, 4, 'java', 
'boolean isValid(String s) {
    Stack<Character> stack = new Stack<>();
    for (char c : s.toCharArray()) {
        if (c == ''('') stack.push('')'');
        else if (c == ''{'') stack.push(''}'');
        else if (c == ''['') stack.push('']'');
        else if (stack.isEmpty() || stack.pop() != c) return false;
    }
    return stack.isEmpty();
}', 
'Accepted', NOW(), false),

(7, 4, 4, 'java', 
'boolean isValid(String s) {
    return true;
}', 
'Wrong Answer', NOW(), false);

-- 16. INSERT SUBMISSIONS - C++
INSERT INTO submissions (id, student_id, problem_id, language, source_code, status, submitted_at, is_test) VALUES
(8, 5, 5, 'cpp', 
'vector<int> merge(vector<int>& nums1, int m, vector<int>& nums2, int n) {
    vector<int> result;
    int i = 0, j = 0;
    while (i < m && j < n) {
        if (nums1[i] <= nums2[j]) result.push_back(nums1[i++]);
        else result.push_back(nums2[j++]);
    }
    while (i < m) result.push_back(nums1[i++]);
    while (j < n) result.push_back(nums2[j++]);
    return result;
}', 
'Accepted', NOW(), false),

(9, 6, 5, 'cpp', 
'vector<int> merge(vector<int>& nums1, int m, vector<int>& nums2, int n) {
    vector<int> result;
    for (int i = 0; i < m; i++) result.push_back(nums1[i]);
    for (int i = 0; i < n; i++) result.push_back(nums2[i]);
    sort(result.begin(), result.end());
    return result;
}', 
'Accepted', NOW(), false);

-- 17. INSERT SUBMISSIONS - COMPILATION ERROR
INSERT INTO submissions (id, student_id, problem_id, language, source_code, status, submitted_at, is_test) VALUES
(10, 3, 4, 'java', 
'public boolean isValid(String s {
    return true;
}', 
'Compile Error', NOW(), false);

-- 18. INSERT SUBMISSIONS - RUNTIME ERROR
INSERT INTO submissions (id, student_id, problem_id, language, source_code, status, submitted_at, is_test) VALUES
(11, 4, 1, 'python', 
'def twoSum(nums: List[int], target: int) -> List[int]:
    return [0, 1/0]', 
'Runtime Error', NOW(), false);

-- 19. INSERT SUBMISSION RESULTS
INSERT INTO submission_results (id, submission_id, test_case_id, status, output_received, error_message, execution_time_ms, memory_used_kb) VALUES
(1, 1, 1, 'Passed', '[0, 1]', NULL, 50, 24),
(2, 1, 2, 'Passed', '[1, 2]', NULL, 30, 23),
(3, 1, 3, 'Passed', '[0, 1]', NULL, 40, 24),

(4, 2, 1, 'Passed', '[0, 1]', NULL, 20, 25),
(5, 2, 2, 'Passed', '[1, 2]', NULL, 20, 25),
(6, 2, 3, 'Passed', '[0, 1]', NULL, 20, 24),

(7, 3, 5, 'Passed', 'true', NULL, 10, 12),
(8, 3, 6, 'Passed', 'false', NULL, 10, 12),
(9, 3, 7, 'Passed', 'false', NULL, 10, 12),
(10, 3, 8, 'Passed', 'true', NULL, 10, 12),

(11, 4, 5, 'Passed', 'true', NULL, 20, 32),
(12, 4, 6, 'Passed', 'false', NULL, 20, 32),
(13, 4, 7, 'Passed', 'false', NULL, 20, 32),
(14, 4, 8, 'Passed', 'true', NULL, 20, 32),

(15, 5, 10, 'Passed', '[o,l,l,e,h]', NULL, 10, 16),
(16, 5, 11, 'Passed', '[h,a,n,n,a,H]', NULL, 10, 16),
(17, 5, 12, 'Passed', '[a]', NULL, 10, 16),

(18, 6, 13, 'Passed', 'true', NULL, 50, 48),
(19, 6, 14, 'Passed', 'true', NULL, 40, 47),
(20, 6, 15, 'Passed', 'false', NULL, 30, 46),

(21, 7, 13, 'Failed', 'true', 'Expected false but got true', 30, 45),
(22, 7, 14, 'Failed', 'true', 'Expected true but got true', 30, 45),

(23, 8, 17, 'Passed', '[1,2,2,3,5,6]', NULL, 80, 52),
(24, 8, 18, 'Passed', '[1]', NULL, 20, 36),

(25, 9, 17, 'Passed', '[1,2,2,3,5,6]', NULL, 120, 64),
(26, 9, 18, 'Passed', '[1]', NULL, 30, 48);

-- 20. UPDATE SEQUENCES
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('classes_id_seq', (SELECT MAX(id) FROM classes));
SELECT setval('problems_id_seq', (SELECT MAX(id) FROM problems));
SELECT setval('test_cases_id_seq', (SELECT MAX(id) FROM test_cases));
SELECT setval('submissions_id_seq', (SELECT MAX(id) FROM submissions));
SELECT setval('submission_results_id_seq', (SELECT MAX(id) FROM submission_results));
