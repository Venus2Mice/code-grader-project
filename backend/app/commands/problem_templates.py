"""Problem template definitions for seeding test data."""

from ..models import Problem, TestCase


def create_two_sum(class_id):
    """Create Two Sum problem (Python)."""
    return Problem(
        title="Two Sum",
        title_vi="Tổng Hai Số",
        description="""Given an array of integers `nums` and an integer `target`, return the **indices** of the two numbers that add up to `target`.

You may assume that each input has **exactly one solution**, and you may not use the same element twice.

**Example:**
```
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
```""",
        description_vi="""Cho một mảng số nguyên `nums` và một số nguyên `target`, trả về **chỉ số** của hai số có tổng bằng `target`.

Bạn có thể giả định rằng mỗi đầu vào có **chính xác một giải pháp**, và bạn không được sử dụng cùng một phần tử hai lần.

**Ví dụ:**
```
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
```""",
        markdown_content="""# Two Sum

## Problem Description
Given an array of integers `nums` and an integer `target`, return **indices** of the two numbers such that they add up to `target`.

## Constraints
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists

## Examples
### Example 1:
```
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: nums[0] + nums[1] = 2 + 7 = 9
```

### Example 2:
```
Input: nums = [3,2,4], target = 6
Output: [1,2]
```

## Hints
- Use a hash map to store values you've seen
- For each number, check if target - number exists in the map""",
        markdown_content_vi="""# Tổng Hai Số

## Mô tả bài toán
Cho một mảng số nguyên `nums` và một số nguyên `target`, trả về **chỉ số** của hai số có tổng bằng `target`.

## Ràng buộc
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Chỉ có một câu trả lời hợp lệ

## Ví dụ
### Ví dụ 1:
```
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Giải thích: nums[0] + nums[1] = 2 + 7 = 9
```

### Ví dụ 2:
```
Input: nums = [3,2,4], target = 6
Output: [1,2]
```

## Gợi ý
- Sử dụng hash map để lưu các giá trị đã gặp
- Với mỗi số, kiểm tra xem target - số đó có tồn tại trong map không""",
        class_id=class_id,
        language="python",
        difficulty="easy",
        function_name="twoSum",
        return_type="int[]",
        parameters=[
            {"name": "nums", "type": "int[]"},
            {"name": "target", "type": "int"}
        ],
        time_limit_ms=2000,
        memory_limit_kb=131072,
        test_cases=[
            TestCase(
                inputs=[{"type": "int[]", "value": [2, 7, 11, 15]}, {"type": "int", "value": 9}],
                expected_output={"type": "int[]", "value": [0, 1]},
                points=25,
                is_hidden=False
            ),
            TestCase(
                inputs=[{"type": "int[]", "value": [3, 2, 4]}, {"type": "int", "value": 6}],
                expected_output={"type": "int[]", "value": [1, 2]},
                points=25,
                is_hidden=False
            ),
            TestCase(
                inputs=[{"type": "int[]", "value": [3, 3]}, {"type": "int", "value": 6}],
                expected_output={"type": "int[]", "value": [0, 1]},
                points=25,
                is_hidden=True
            ),
            TestCase(
                inputs=[{"type": "int[]", "value": [-1000000000, 1000000000, 500, -500]}, {"type": "int", "value": 0}],
                expected_output={"type": "int[]", "value": [2, 3]},
                points=25,
                is_hidden=True
            )
        ]
    )


def create_palindrome_number(class_id):
    """Create Palindrome Number problem (C++)."""
    return Problem(
        title="Palindrome Number",
        title_vi="Số Đối Xứng",
        description="""Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.""",
        description_vi="""Cho một số nguyên `x`, trả về `true` nếu `x` là số đối xứng, và `false` nếu không.""",
        markdown_content="""# Palindrome Number

## Problem Description
An integer is a palindrome when it reads the same backward as forward.

## Constraints
- -2^31 <= x <= 2^31 - 1

## Examples
### Example 1:
```
Input: x = 121
Output: true
Explanation: 121 reads as 121 from left to right and from right to left.
```

### Example 2:
```
Input: x = -121
Output: false
Explanation: From left to right, it reads -121. From right to left, it becomes 121-.
```

## Follow-up
Could you solve it without converting the integer to a string?""",
        markdown_content_vi="""# Số Đối Xứng

## Mô tả bài toán
Một số nguyên là số đối xứng khi nó đọc giống nhau từ trái sang phải và từ phải sang trái.

## Ràng buộc
- -2^31 <= x <= 2^31 - 1

## Ví dụ
### Ví dụ 1:
```
Input: x = 121
Output: true
Giải thích: 121 đọc là 121 từ trái sang phải và từ phải sang trái.
```

### Ví dụ 2:
```
Input: x = -121
Output: false
Giải thích: Từ trái sang phải, nó đọc là -121. Từ phải sang trái, nó trở thành 121-.
```

## Mở rộng
Bạn có thể giải quyết mà không chuyển số nguyên thành chuỗi?""",
        class_id=class_id,
        language="cpp",
        difficulty="easy",
        function_name="isPalindrome",
        return_type="bool",
        parameters=[{"name": "x", "type": "int"}],
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
        title_vi="Đảo Ngược Chuỗi",
        description="""Write a function that reverses a string. The input string is given as an array of characters `s`.""",
        description_vi="""Viết một hàm đảo ngược chuỗi. Chuỗi đầu vào được cho dưới dạng mảng ký tự `s`.""",
        markdown_content="""# Reverse String

## Problem Description
Write a function that reverses a string. The input string is given as an array of characters `s`.

You must do this by modifying the input array in-place with O(1) extra memory.

## Constraints
- 1 <= s.length <= 10^5
- s[i] is a printable ascii character

## Examples
### Example 1:
```
Input: s = ["h","e","l","l","o"]
Output: ["o","l","l","e","h"]
```

### Example 2:
```
Input: s = ["H","a","n","n","a","h"]
Output: ["h","a","n","n","a","H"]
```""",
        markdown_content_vi="""# Đảo Ngược Chuỗi

## Mô tả bài toán
Viết một hàm đảo ngược chuỗi. Chuỗi đầu vào được cho dưới dạng mảng ký tự `s`.

Bạn phải làm điều này bằng cách sửa đổi mảng đầu vào tại chỗ với O(1) bộ nhớ phụ.

## Ràng buộc
- 1 <= s.length <= 10^5
- s[i] là ký tự ascii có thể in

## Ví dụ
### Ví dụ 1:
```
Input: s = ["h","e","l","l","o"]
Output: ["o","l","l","e","h"]
```

### Ví dụ 2:
```
Input: s = ["H","a","n","n","a","h"]
Output: ["h","a","n","n","a","H"]
```""",
        class_id=class_id,
        language="java",
        difficulty="easy",
        function_name="reverseString",
        return_type="void",
        parameters=[{"name": "s", "type": "char[]"}],
        time_limit_ms=1500,
        memory_limit_kb=131072,
        test_cases=[
            TestCase(inputs=[{"type": "char[]", "value": ["h", "e", "l", "l", "o"]}], expected_output={"type": "char[]", "value": ["o", "l", "l", "e", "h"]}, points=30, is_hidden=False),
            TestCase(inputs=[{"type": "char[]", "value": ["H", "a", "n", "n", "a", "h"]}], expected_output={"type": "char[]", "value": ["h", "a", "n", "n", "a", "H"]}, points=30, is_hidden=False),
            TestCase(inputs=[{"type": "char[]", "value": ["A"]}], expected_output={"type": "char[]", "value": ["A"]}, points=20, is_hidden=True),
            TestCase(inputs=[{"type": "char[]", "value": ["a", "b"]}], expected_output={"type": "char[]", "value": ["b", "a"]}, points=20, is_hidden=True)
        ]
    )


def create_rotate_image(class_id):
    """Create Rotate Image problem (Python)."""
    return Problem(
        title="Rotate Image",
        title_vi="Xoay Ma Trận",
        description="""Rotate the n x n 2D matrix by 90 degrees clockwise in-place.""",
        description_vi="""Xoay ma trận 2D n x n 90 độ theo chiều kim đồng hồ tại chỗ.""",
        markdown_content="""# Rotate Image

## Problem Description
You are given an n x n 2D matrix representing an image, rotate the image by 90 degrees (clockwise).

You have to rotate the image in-place, which means you have to modify the input 2D matrix directly. DO NOT allocate another 2D matrix and do the rotation.

## Constraints
- n == matrix.length == matrix[i].length
- 1 <= n <= 20
- -1000 <= matrix[i][j] <= 1000

## Examples
### Example 1:
```
Input: matrix = [[1,2,3],[4,5,6],[7,8,9]]
Output: [[7,4,1],[8,5,2],[9,6,3]]
```

### Example 2:
```
Input: matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]
Output: [[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]
```""",
        markdown_content_vi="""# Xoay Ma Trận

## Mô tả bài toán
Bạn được cho một ma trận 2D n x n đại diện cho một hình ảnh, xoay hình ảnh 90 độ (theo chiều kim đồng hồ).

Bạn phải xoay hình ảnh tại chỗ, có nghĩa là bạn phải sửa đổi ma trận 2D đầu vào trực tiếp. KHÔNG cấp phát ma trận 2D khác và thực hiện xoay.

## Ràng buộc
- n == matrix.length == matrix[i].length
- 1 <= n <= 20
- -1000 <= matrix[i][j] <= 1000

## Ví dụ
### Ví dụ 1:
```
Input: matrix = [[1,2,3],[4,5,6],[7,8,9]]
Output: [[7,4,1],[8,5,2],[9,6,3]]
```

### Ví dụ 2:
```
Input: matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]
Output: [[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]
```""",
        class_id=class_id,
        language="python",
        difficulty="medium",
        function_name="rotate",
        return_type="void",
        parameters=[{"name": "matrix", "type": "int[][]"}],
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
        title_vi="Anagram Hợp Lệ",
        description="""Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`.""",
        description_vi="""Cho hai chuỗi `s` và `t`, trả về `true` nếu `t` là anagram của `s`.""",
        markdown_content="""# Valid Anagram

## Problem Description
Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

## Constraints
- 1 <= s.length, t.length <= 5 * 10^4
- s and t consist of lowercase English letters

## Examples
### Example 1:
```
Input: s = "anagram", t = "nagaram"
Output: true
```

### Example 2:
```
Input: s = "rat", t = "car"
Output: false
```""",
        markdown_content_vi="""# Anagram Hợp Lệ

## Mô tả bài toán
Cho hai chuỗi `s` và `t`, trả về `true` nếu `t` là anagram của `s`, và `false` nếu không.

Một Anagram là một từ hoặc cụm từ được tạo thành bằng cách sắp xếp lại các chữ cái của một từ hoặc cụm từ khác, thường sử dụng tất cả các chữ cái gốc chính xác một lần.

## Ràng buộc
- 1 <= s.length, t.length <= 5 * 10^4
- s và t chỉ gồm các chữ cái tiếng Anh viết thường

## Ví dụ
### Ví dụ 1:
```
Input: s = "anagram", t = "nagaram"
Output: true
```

### Ví dụ 2:
```
Input: s = "rat", t = "car"
Output: false
```""",
        class_id=class_id,
        language="cpp",
        difficulty="easy",
        function_name="isAnagram",
        return_type="bool",
        parameters=[
            {"name": "s", "type": "string"},
            {"name": "t", "type": "string"}
        ],
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
        title_vi="Số Fibonacci",
        description="""The Fibonacci numbers form a sequence. Given `n`, calculate F(n).""",
        description_vi="""Các số Fibonacci tạo thành một dãy số. Cho `n`, tính F(n).""",
        markdown_content="""# Fibonacci Number

## Problem Description
The Fibonacci numbers, commonly denoted F(n) form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1. That is,

```
F(0) = 0, F(1) = 1
F(n) = F(n - 1) + F(n - 2), for n > 1
```

Given n, calculate F(n).

## Constraints
- 0 <= n <= 30

## Examples
### Example 1:
```
Input: n = 2
Output: 1
Explanation: F(2) = F(1) + F(0) = 1 + 0 = 1
```

### Example 2:
```
Input: n = 4
Output: 3
Explanation: F(4) = F(3) + F(2) = 2 + 1 = 3
```""",
        markdown_content_vi="""# Số Fibonacci

## Mô tả bài toán
Các số Fibonacci, thường được ký hiệu là F(n) tạo thành một dãy số, gọi là dãy Fibonacci, sao cho mỗi số là tổng của hai số trước đó, bắt đầu từ 0 và 1. Đó là,

```
F(0) = 0, F(1) = 1
F(n) = F(n - 1) + F(n - 2), với n > 1
```

Cho n, tính F(n).

## Ràng buộc
- 0 <= n <= 30

## Ví dụ
### Ví dụ 1:
```
Input: n = 2
Output: 1
Giải thích: F(2) = F(1) + F(0) = 1 + 0 = 1
```

### Ví dụ 2:
```
Input: n = 4
Output: 3
Giải thích: F(4) = F(3) + F(2) = 2 + 1 = 3
```""",
        class_id=class_id,
        language="python",
        difficulty="easy",
        function_name="fib",
        return_type="int",
        parameters=[{"name": "n", "type": "int"}],
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
        title_vi="Chứa Nước Nhiều Nhất",
        description="""Find two lines that together with the x-axis form a container with the most water.""",
        description_vi="""Tìm hai đường thẳng mà cùng với trục x tạo thành một thùng chứa nước nhiều nhất.""",
        markdown_content="""# Container With Most Water

## Problem Description
You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i`th line are `(i, 0)` and `(i, height[i])`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.

**Notice** that you may not slant the container.

## Constraints
- n == height.length
- 2 <= n <= 10^5
- 0 <= height[i] <= 10^4

## Examples
### Example 1:
```
Input: height = [1,8,6,2,5,4,8,3,7]
Output: 49
Explanation: Lines at index 1 and 8 form container with most water.
Area = min(8, 7) * (8 - 1) = 7 * 7 = 49
```

### Example 2:
```
Input: height = [1,1]
Output: 1
```

## Hints
- Use two pointers, one at each end
- Move the pointer pointing to shorter line""",
        markdown_content_vi="""# Chứa Nước Nhiều Nhất

## Mô tả bài toán
Bạn được cho một mảng số nguyên `height` có độ dài `n`. Có `n` đường thẳng đứng được vẽ sao cho hai điểm cuối của đường thẳng thứ `i` là `(i, 0)` và `(i, height[i])`.

Tìm hai đường thẳng mà cùng với trục x tạo thành một thùng chứa, sao cho thùng chứa chứa nhiều nước nhất.

Trả về lượng nước tối đa mà một thùng chứa có thể chứa.

**Lưu ý** rằng bạn không được nghiêng thùng chứa.

## Ràng buộc
- n == height.length
- 2 <= n <= 10^5
- 0 <= height[i] <= 10^4

## Ví dụ
### Ví dụ 1:
```
Input: height = [1,8,6,2,5,4,8,3,7]
Output: 49
Giải thích: Các đường tại chỉ số 1 và 8 tạo thành thùng chứa nước nhiều nhất.
Diện tích = min(8, 7) * (8 - 1) = 7 * 7 = 49
```

### Ví dụ 2:
```
Input: height = [1,1]
Output: 1
```

## Gợi ý
- Sử dụng hai con trỏ, một ở mỗi đầu
- Di chuyển con trỏ trỏ đến đường ngắn hơn""",
        class_id=class_id,
        language="cpp",
        difficulty="medium",
        function_name="maxArea",
        return_type="int",
        parameters=[{"name": "height", "type": "int[]"}],
        time_limit_ms=1000,
        memory_limit_kb=65536,
        test_cases=[
            TestCase(inputs=[{"type": "int[]", "value": [1,8,6,2,5,4,8,3,7]}], expected_output={"type": "int", "value": 49}, points=40, is_hidden=False),
            TestCase(inputs=[{"type": "int[]", "value": [1,1]}], expected_output={"type": "int", "value": 1}, points=30, is_hidden=False),
            TestCase(inputs=[{"type": "int[]", "value": [1,2,4,3]*250}], expected_output={"type": "int", "value": 996}, points=30, is_hidden=True)
        ]
    )


def create_merge_sorted_arrays(class_id):
    """Create Merge Sorted Array problem (Python) - NEW."""
    return Problem(
        title="Merge Sorted Array",
        title_vi="Gộp Mảng Đã Sắp Xếp",
        description="""Merge two sorted arrays into one sorted array.""",
        description_vi="""Gộp hai mảng đã sắp xếp thành một mảng đã sắp xếp.""",
        markdown_content="""# Merge Sorted Array

## Problem Description
You are given two integer arrays `nums1` and `nums2`, sorted in **non-decreasing order**, and two integers `m` and `n`, representing the number of elements in `nums1` and `nums2` respectively.

Merge `nums1` and `nums2` into a single array sorted in **non-decreasing order**.

The final sorted array should not be returned by the function, but instead be stored inside the array `nums1`. To accommodate this, `nums1` has a length of `m + n`, where the first `m` elements denote the elements that should be merged, and the last `n` elements are set to 0 and should be ignored. `nums2` has a length of `n`.

## Constraints
- nums1.length == m + n
- nums2.length == n
- 0 <= m, n <= 200
- 1 <= m + n <= 200
- -10^9 <= nums1[i], nums2[j] <= 10^9

## Examples
### Example 1:
```
Input: nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3
Output: [1,2,2,3,5,6]
Explanation: The arrays we are merging are [1,2,3] and [2,5,6].
The result is [1,2,2,3,5,6].
```

### Example 2:
```
Input: nums1 = [1], m = 1, nums2 = [], n = 0
Output: [1]
```""",
        markdown_content_vi="""# Gộp Mảng Đã Sắp Xếp

## Mô tả bài toán
Bạn được cho hai mảng số nguyên `nums1` và `nums2`, được sắp xếp theo **thứ tự không giảm**, và hai số nguyên `m` và `n`, đại diện cho số phần tử trong `nums1` và `nums2` tương ứng.

Gộp `nums1` và `nums2` thành một mảng đơn được sắp xếp theo **thứ tự không giảm**.

Mảng đã sắp xếp cuối cùng không nên được trả về bởi hàm, mà thay vào đó được lưu trữ bên trong mảng `nums1`. Để phù hợp với điều này, `nums1` có độ dài `m + n`, trong đó `m` phần tử đầu tiên biểu thị các phần tử cần được gộp, và `n` phần tử cuối cùng được đặt thành 0 và nên được bỏ qua. `nums2` có độ dài `n`.

## Ràng buộc
- nums1.length == m + n
- nums2.length == n
- 0 <= m, n <= 200
- 1 <= m + n <= 200
- -10^9 <= nums1[i], nums2[j] <= 10^9

## Ví dụ
### Ví dụ 1:
```
Input: nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3
Output: [1,2,2,3,5,6]
Giải thích: Các mảng chúng ta đang gộp là [1,2,3] và [2,5,6].
Kết quả là [1,2,2,3,5,6].
```

### Ví dụ 2:
```
Input: nums1 = [1], m = 1, nums2 = [], n = 0
Output: [1]
```""",
        class_id=class_id,
        language="python",
        difficulty="easy",
        function_name="merge",
        return_type="void",
        parameters=[
            {"name": "nums1", "type": "int[]"},
            {"name": "m", "type": "int"},
            {"name": "nums2", "type": "int[]"},
            {"name": "n", "type": "int"}
        ],
        time_limit_ms=1000,
        memory_limit_kb=65536,
        test_cases=[
            TestCase(
                inputs=[
                    {"type": "int[]", "value": [1,2,3,0,0,0]},
                    {"type": "int", "value": 3},
                    {"type": "int[]", "value": [2,5,6]},
                    {"type": "int", "value": 3}
                ],
                expected_output={"type": "int[]", "value": [1,2,2,3,5,6]},
                points=30,
                is_hidden=False
            ),
            TestCase(
                inputs=[
                    {"type": "int[]", "value": [1]},
                    {"type": "int", "value": 1},
                    {"type": "int[]", "value": []},
                    {"type": "int", "value": 0}
                ],
                expected_output={"type": "int[]", "value": [1]},
                points=20,
                is_hidden=False
            ),
            TestCase(
                inputs=[
                    {"type": "int[]", "value": [0]},
                    {"type": "int", "value": 0},
                    {"type": "int[]", "value": [1]},
                    {"type": "int", "value": 1}
                ],
                expected_output={"type": "int[]", "value": [1]},
                points=25,
                is_hidden=True
            ),
            TestCase(
                inputs=[
                    {"type": "int[]", "value": [4,5,6,0,0,0]},
                    {"type": "int", "value": 3},
                    {"type": "int[]", "value": [1,2,3]},
                    {"type": "int", "value": 3}
                ],
                expected_output={"type": "int[]", "value": [1,2,3,4,5,6]},
                points=25,
                is_hidden=True
            )
        ]
    )


def create_longest_common_prefix(class_id):
    """Create Longest Common Prefix problem (Java) - NEW."""
    return Problem(
        title="Longest Common Prefix",
        title_vi="Tiền Tố Chung Dài Nhất",
        description="""Find the longest common prefix string amongst an array of strings.""",
        description_vi="""Tìm chuỗi tiền tố chung dài nhất trong một mảng các chuỗi.""",
        markdown_content="""# Longest Common Prefix

## Problem Description
Write a function to find the longest common prefix string amongst an array of strings.

If there is no common prefix, return an empty string `""`.

## Constraints
- 1 <= strs.length <= 200
- 0 <= strs[i].length <= 200
- strs[i] consists of only lowercase English letters

## Examples
### Example 1:
```
Input: strs = ["flower","flow","flight"]
Output: "fl"
```

### Example 2:
```
Input: strs = ["dog","racecar","car"]
Output: ""
Explanation: There is no common prefix among the input strings.
```

## Hints
- Compare characters vertically (character by character across all strings)
- Stop when you find a mismatch or reach the end of any string""",
        markdown_content_vi="""# Tiền Tố Chung Dài Nhất

## Mô tả bài toán
Viết một hàm để tìm chuỗi tiền tố chung dài nhất trong một mảng các chuỗi.

Nếu không có tiền tố chung, trả về chuỗi rỗng `""`.

## Ràng buộc
- 1 <= strs.length <= 200
- 0 <= strs[i].length <= 200
- strs[i] chỉ gồm các chữ cái tiếng Anh viết thường

## Ví dụ
### Ví dụ 1:
```
Input: strs = ["flower","flow","flight"]
Output: "fl"
```

### Ví dụ 2:
```
Input: strs = ["dog","racecar","car"]
Output: ""
Giải thích: Không có tiền tố chung nào trong các chuỗi đầu vào.
```

## Gợi ý
- So sánh ký tự theo chiều dọc (từng ký tự trên tất cả các chuỗi)
- Dừng lại khi bạn tìm thấy sự không khớp hoặc đạt đến cuối của bất kỳ chuỗi nào""",
        class_id=class_id,
        language="java",
        difficulty="easy",
        function_name="longestCommonPrefix",
        return_type="string",
        parameters=[{"name": "strs", "type": "string[]"}],
        time_limit_ms=1000,
        memory_limit_kb=65536,
        test_cases=[
            TestCase(
                inputs=[{"type": "string[]", "value": ["flower","flow","flight"]}],
                expected_output={"type": "string", "value": "fl"},
                points=30,
                is_hidden=False
            ),
            TestCase(
                inputs=[{"type": "string[]", "value": ["dog","racecar","car"]}],
                expected_output={"type": "string", "value": ""},
                points=25,
                is_hidden=False
            ),
            TestCase(
                inputs=[{"type": "string[]", "value": ["ab","a"]}],
                expected_output={"type": "string", "value": "a"},
                points=20,
                is_hidden=True
            ),
            TestCase(
                inputs=[{"type": "string[]", "value": ["cir","car"]}],
                expected_output={"type": "string", "value": "c"},
                points=25,
                is_hidden=True
            )
        ]
    )


def get_sample_solutions(problem_title, language):
    """
    Get sample solution code for a given problem title and language.
    Returns dict with 'correct', 'wrong', 'partial', etc. solution types.
    """
    solutions = {
        "Two Sum": {
            "correct": """class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, num in enumerate(nums):
            if target - num in seen:
                return [seen[target - num], i]
            seen[num] = i
        return []""",
            "wrong": """class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Wrong: doesn't handle all cases properly
        for i in range(len(nums)):
            for j in range(i+1, len(nums)):
                if nums[i] + nums[j] == target:
                    return [j, i]  # Wrong order!
        return []"""
        },
        "Palindrome Number": {
            "correct": """#include <iostream>
using namespace std;
class Solution {
public:
    bool isPalindrome(int x) {
        if (x < 0) return false;
        int reversed = 0, original = x;
        while (x > 0) {
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
        // Wrong: doesn't handle negative numbers
        int reversed = 0, original = x;
        while (x > 0) {
            reversed = reversed * 10 + x % 10;
            x /= 10;
        }
        return original == reversed;
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
            s[left++] = s[right];
            s[right--] = temp;
        }
    }
}""",
            "wrong": """import java.util.*;
class Solution {
    public void reverseString(char[] s) {
        // Wrong: off-by-one error
        int left = 0, right = s.length - 1;
        while (left <= right) {  // Should be <, not <=
            char temp = s[left];
            s[left++] = s[right];
            s[right--] = temp;
        }
    }
}"""
        },
        "Rotate Image": {
            "correct": """class Solution:
    def rotate(self, matrix: List[List[int]]) -> None:
        n = len(matrix)
        for i in range(n):
            for j in range(i, n):
                matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
        for row in matrix:
            row.reverse()""",
            "wrong": """class Solution:
    def rotate(self, matrix: List[List[int]]) -> None:
        # Wrong: only transposes, doesn't reverse rows
        n = len(matrix)
        for i in range(n):
            for j in range(i, n):
                matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]"""
        },
        "Valid Anagram": {
            "correct": """#include <string>
#include <unordered_map>
using namespace std;
class Solution {
public:
    bool isAnagram(string s, string t) {
        if (s.length() != t.length()) return false;
        unordered_map<char, int> count;
        for (char c : s) count[c]++;
        for (char c : t) if (--count[c] < 0) return false;
        return true;
    }
};""",
            "wrong": """#include <string>
#include <unordered_map>
using namespace std;
class Solution {
public:
    bool isAnagram(string s, string t) {
        // Wrong: doesn't check length first
        unordered_map<char, int> count;
        for (char c : s) count[c]++;
        for (char c : t) if (--count[c] < 0) return false;
        return true;  // Missing final check
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
        # Wrong: off-by-one in loop range
        if n <= 1:
            return n
        a, b = 0, 1
        for _ in range(2, n):  # Should be n+1
            a, b = b, a + b
        return b"""
        },
        "Container With Most Water": {
            "correct": """#include <vector>
#include <algorithm>
using namespace std;
class Solution {
public:
    int maxArea(vector<int>& height) {
        int maxArea = 0, left = 0, right = height.size() - 1;
        while (left < right) {
            maxArea = max(maxArea, min(height[left], height[right]) * (right - left));
            if (height[left] < height[right]) left++;
            else right--;
        }
        return maxArea;
    }
};""",
            "wrong": """#include <vector>
#include <algorithm>
using namespace std;
class Solution {
public:
    int maxArea(vector<int>& height) {
        // Wrong: always moves left pointer
        int maxArea = 0, left = 0, right = height.size() - 1;
        while (left < right) {
            maxArea = max(maxArea, min(height[left], height[right]) * (right - left));
            left++;  // Wrong: should check which is smaller
        }
        return maxArea;
    }
};"""
        },
        "Merge Sorted Array": {
            "correct": """class Solution:
    def merge(self, nums1: List[int], m: int, nums2: List[int], n: int) -> None:
        i, j, k = m - 1, n - 1, m + n - 1
        while j >= 0:
            if i >= 0 and nums1[i] > nums2[j]:
                nums1[k] = nums1[i]
                i -= 1
            else:
                nums1[k] = nums2[j]
                j -= 1
            k -= 1""",
            "wrong": """class Solution:
    def merge(self, nums1: List[int], m: int, nums2: List[int], n: int) -> None:
        # Wrong: merges from front, causing overwrite issues
        i, j, k = 0, 0, 0
        while j < n:
            if i < m and nums1[i] < nums2[j]:
                i += 1
            else:
                nums1[k] = nums2[j]
                j += 1
            k += 1"""
        },
        "Longest Common Prefix": {
            "correct": """import java.util.*;
class Solution {
    public String longestCommonPrefix(String[] strs) {
        if (strs == null || strs.length == 0) return "";
        String prefix = strs[0];
        for (int i = 1; i < strs.length; i++) {
            while (strs[i].indexOf(prefix) != 0) {
                prefix = prefix.substring(0, prefix.length() - 1);
                if (prefix.isEmpty()) return "";
            }
        }
        return prefix;
    }
}""",
            "wrong": """import java.util.*;
class Solution {
    public String longestCommonPrefix(String[] strs) {
        // Wrong: doesn't handle empty array
        String prefix = strs[0];
        for (int i = 1; i < strs.length; i++) {
            while (strs[i].indexOf(prefix) != 0) {
                prefix = prefix.substring(0, prefix.length() - 1);
            }
        }
        return prefix;
    }
}"""
        }
    }
    
    return solutions.get(problem_title, {})

