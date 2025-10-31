"""Problem template definitions for seeding test data."""

from ..models import Problem, TestCase


def create_two_sum(class_id):
    """Create Two Sum problem (Python)."""
    return Problem(
        title="Two Sum",
        description="""Given an array of integers `nums` and an integer `target`, return the **indices** of the two numbers that add up to `target`.

You may assume that each input has **exactly one solution**, and you may not use the same element twice.

**Example:**
```
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
```""",
        class_id=class_id,
        language="python",
        difficulty="easy",
        function_name="twoSum",
        time_limit_ms=2000,
        memory_limit_kb=131072,
        test_cases=[
            TestCase(
                inputs=[{"type": "int[]", "value": [2, 7, 11, 15]}, {"type": "int", "value": 9}],
                expected_output={"type": "int[]", "value": [0, 1]},
                points=30,
                is_hidden=False
            ),
            TestCase(
                inputs=[{"type": "int[]", "value": [3, 2, 4]}, {"type": "int", "value": 6}],
                expected_output={"type": "int[]", "value": [1, 2]},
                points=30,
                is_hidden=False
            ),
            TestCase(
                inputs=[{"type": "int[]", "value": [3, 3]}, {"type": "int", "value": 6}],
                expected_output={"type": "int[]", "value": [0, 1]},
                points=20,
                is_hidden=True
            ),
            TestCase(
                inputs=[{"type": "int[]", "value": [-1000000000, 1000000000, 500, -500]}, {"type": "int", "value": 0}],
                expected_output={"type": "int[]", "value": [2, 3]},
                points=20,
                is_hidden=True
            )
        ]
    )


def create_palindrome_number(class_id):
    """Create Palindrome Number problem (C++)."""
    return Problem(
        title="Palindrome Number",
        description="""Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.""",
        class_id=class_id,
        language="cpp",
        difficulty="easy",
        function_name="isPalindrome",
        time_limit_ms=1000,
        memory_limit_kb=65536,
        test_cases=[
            TestCase(inputs=[{"type": "int", "value": 121}], expected_output={"type": "bool", "value": True}, points=20, is_hidden=False),
            TestCase(inputs=[{"type": "int", "value": -121}], expected_output={"type": "bool", "value": False}, points=20, is_hidden=False),
            TestCase(inputs=[{"type": "int", "value": 10}], expected_output={"type": "bool", "value": False}, points=20, is_hidden=False),
            TestCase(inputs=[{"type": "int", "value": 0}], expected_output={"type": "bool", "value": True}, points=20, is_hidden=True),
            TestCase(inputs=[{"type": "int", "value": 2147483647}], expected_output={"type": "bool", "value": False}, points=20, is_hidden=True)
        ]
    )


def create_reverse_string(class_id):
    """Create Reverse String problem (Java)."""
    return Problem(
        title="Reverse String",
        description="""Write a function that reverses a string. The input string is given as an array of characters `s`.""",
        class_id=class_id,
        language="java",
        difficulty="easy",
        function_name="reverseString",
        time_limit_ms=1500,
        memory_limit_kb=131072,
        test_cases=[
            TestCase(inputs=[{"type": "char[]", "value": ["h", "e", "l", "l", "o"]}], expected_output={"type": "char[]", "value": ["o", "l", "l", "e", "h"]}, points=30, is_hidden=False),
            TestCase(inputs=[{"type": "char[]", "value": ["H", "a", "n", "n", "a", "h"]}], expected_output={"type": "char[]", "value": ["h", "a", "n", "n", "a", "H"]}, points=30, is_hidden=False),
            TestCase(inputs=[{"type": "char[]", "value": ["A"]}], expected_output={"type": "char[]", "value": ["A"]}, points=20, is_hidden=True),
            TestCase(inputs=[{"type": "char[]", "value": []}], expected_output={"type": "char[]", "value": []}, points=20, is_hidden=True)
        ]
    )


def create_rotate_image(class_id):
    """Create Rotate Image problem (Python)."""
    return Problem(
        title="Rotate Image",
        description="""Rotate the n x n 2D matrix by 90 degrees clockwise in-place.""",
        class_id=class_id,
        language="python",
        difficulty="medium",
        function_name="rotate",
        time_limit_ms=2000,
        memory_limit_kb=131072,
        test_cases=[
            TestCase(inputs=[{"type": "int[][]", "value": [[1,2,3],[4,5,6],[7,8,9]]}], expected_output={"type": "int[][]", "value": [[7,4,1],[8,5,2],[9,6,3]]}, points=30, is_hidden=False),
            TestCase(inputs=[{"type": "int[][]", "value": [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]}], expected_output={"type": "int[][]", "value": [[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]}, points=30, is_hidden=False),
            TestCase(inputs=[{"type": "int[][]", "value": [[1,2],[3,4]]}], expected_output={"type": "int[][]", "value": [[3,1],[4,2]]}, points=20, is_hidden=False),
            TestCase(inputs=[{"type": "int[][]", "value": [[1]]}], expected_output={"type": "int[][]", "value": [[1]]}, points=20, is_hidden=True)
        ]
    )


def create_valid_anagram(class_id):
    """Create Valid Anagram problem (C++)."""
    return Problem(
        title="Valid Anagram",
        description="""Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`.""",
        class_id=class_id,
        language="cpp",
        difficulty="easy",
        function_name="isAnagram",
        time_limit_ms=1000,
        memory_limit_kb=65536,
        test_cases=[
            TestCase(inputs=[{"type": "string", "value": "anagram"}, {"type": "string", "value": "nagaram"}], expected_output={"type": "bool", "value": True}, points=30, is_hidden=False),
            TestCase(inputs=[{"type": "string", "value": "rat"}, {"type": "string", "value": "car"}], expected_output={"type": "bool", "value": False}, points=30, is_hidden=False),
            TestCase(inputs=[{"type": "string", "value": ""}, {"type": "string", "value": ""}], expected_output={"type": "bool", "value": True}, points=20, is_hidden=True),
            TestCase(inputs=[{"type": "string", "value": "a"}, {"type": "string", "value": "ab"}], expected_output={"type": "bool", "value": False}, points=20, is_hidden=True)
        ]
    )


def create_fibonacci(class_id):
    """Create Fibonacci Number problem (Python)."""
    return Problem(
        title="Fibonacci Number",
        description="""The Fibonacci numbers form a sequence. Given `n`, calculate F(n).""",
        class_id=class_id,
        language="python",
        difficulty="easy",
        function_name="fib",
        time_limit_ms=500,
        memory_limit_kb=65536,
        test_cases=[
            TestCase(inputs=[{"type": "int", "value": 2}], expected_output={"type": "int", "value": 1}, points=15, is_hidden=False),
            TestCase(inputs=[{"type": "int", "value": 4}], expected_output={"type": "int", "value": 3}, points=15, is_hidden=False),
            TestCase(inputs=[{"type": "int", "value": 10}], expected_output={"type": "int", "value": 55}, points=20, is_hidden=False),
            TestCase(inputs=[{"type": "int", "value": 30}], expected_output={"type": "int", "value": 832040}, points=30, is_hidden=True),
            TestCase(inputs=[{"type": "int", "value": 0}], expected_output={"type": "int", "value": 0}, points=20, is_hidden=True)
        ]
    )


def create_container_water(class_id):
    """Create Container With Most Water problem (C++)."""
    return Problem(
        title="Container With Most Water",
        description="""Find two lines that together with the x-axis form a container with the most water.""",
        class_id=class_id,
        language="cpp",
        difficulty="medium",
        function_name="maxArea",
        time_limit_ms=1000,
        memory_limit_kb=65536,
        test_cases=[
            TestCase(inputs=[{"type": "int[]", "value": [1,8,6,2,5,4,8,3,7]}], expected_output={"type": "int", "value": 49}, points=40, is_hidden=False),
            TestCase(inputs=[{"type": "int[]", "value": [1,1]}], expected_output={"type": "int", "value": 1}, points=30, is_hidden=False),
            TestCase(inputs=[{"type": "int[]", "value": [1,2,4,3]*250}], expected_output={"type": "int", "value": 996}, points=30, is_hidden=True)
        ]
    )
