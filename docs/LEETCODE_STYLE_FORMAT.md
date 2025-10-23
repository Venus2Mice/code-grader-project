# LeetCode-Style Grading System Design

## Overview

This document describes the new unified grading system that replaces both STDIO and Function-based modes with a single LeetCode-style approach.

## Input/Output Format

### Test Case Schema

```json
{
  "test_case_id": 1,
  "inputs": [
    {
      "type": "int[]",
      "value": [2, 7, 11, 15]
    },
    {
      "type": "int",
      "value": 9
    }
  ],
  "expected_output": {
    "type": "int[]",
    "value": [0, 1]
  },
  "is_hidden": false,
  "points": 50
}
```

### Supported Types

#### Basic Types
- `int`: Integer
- `long`: Long integer
- `float`: Floating point
- `double`: Double precision float
- `bool`: Boolean
- `string`: String
- `char`: Character

#### Array Types
- `int[]`: Array of integers
- `string[]`: Array of strings
- `int[][]`: 2D array (matrix)
- `string[][]`: 2D array of strings

#### Complex Types (Future)
- `ListNode`: Linked list (serialized as array)
- `TreeNode`: Binary tree (level-order array)
- `Node`: Generic node structure

## Type Mapping Across Languages

| Generic Type | Python | C++ | Java |
|--------------|--------|-----|------|
| `int` | `int` | `int` | `int` |
| `long` | `int` | `long long` | `long` |
| `float` | `float` | `float` | `float` |
| `double` | `float` | `double` | `double` |
| `bool` | `bool` | `bool` | `boolean` |
| `string` | `str` | `string` | `String` |
| `char` | `str` | `char` | `char` |
| `int[]` | `List[int]` | `vector<int>` | `int[]` |
| `string[]` | `List[str]` | `vector<string>` | `String[]` |
| `int[][]` | `List[List[int]]` | `vector<vector<int>>` | `int[][]` |

## Function Signature Format

### Python
```python
def twoSum(nums: List[int], target: int) -> List[int]:
    pass
```

### C++
```cpp
vector<int> twoSum(vector<int>& nums, int target) {
    
}
```

### Java
```java
public int[] twoSum(int[] nums, int target) {
    
}
```

## Test Harness Generation

### Python Example

```python
import json
from typing import List

# User code
def twoSum(nums: List[int], target: int) -> List[int]:
    # Student implementation
    pass

# Auto-generated test harness
if __name__ == "__main__":
    test_results = []
    
    # Test case 1
    try:
        nums_1 = [2, 7, 11, 15]
        target_1 = 9
        result_1 = twoSum(nums_1, target_1)
        print(json.dumps(result_1))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
    
    # Test case 2
    try:
        nums_2 = [3, 2, 4]
        target_2 = 6
        result_2 = twoSum(nums_2, target_2)
        print(json.dumps(result_2))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
```

### C++ Example

```cpp
#include <iostream>
#include <vector>
#include <nlohmann/json.hpp>

using namespace std;
using json = nlohmann::json;

// User code
vector<int> twoSum(vector<int>& nums, int target) {
    // Student implementation
    return {};
}

int main() {
    // Test case 1
    try {
        vector<int> nums_1 = {2, 7, 11, 15};
        int target_1 = 9;
        auto result_1 = twoSum(nums_1, target_1);
        json j1(result_1);
        cout << j1.dump() << endl;
    } catch (const exception& e) {
        json err = {{"error", e.what()}};
        cout << err.dump() << endl;
    }
    
    // Test case 2
    try {
        vector<int> nums_2 = {3, 2, 4};
        int target_2 = 6;
        auto result_2 = twoSum(nums_2, target_2);
        json j2(result_2);
        cout << j2.dump() << endl;
    } catch (const exception& e) {
        json err = {{"error", e.what()}};
        cout << err.dump() << endl;
    }
    
    return 0;
}
```

### Java Example

```java
import com.google.gson.Gson;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Student implementation
        return new int[]{};
    }
}

public class Main {
    public static void main(String[] args) {
        Gson gson = new Gson();
        Solution solution = new Solution();
        
        // Test case 1
        try {
            int[] nums_1 = {2, 7, 11, 15};
            int target_1 = 9;
            int[] result_1 = solution.twoSum(nums_1, target_1);
            System.out.println(gson.toJson(result_1));
        } catch (Exception e) {
            System.out.println("{\"error\":\"" + e.getMessage() + "\"}");
        }
        
        // Test case 2
        try {
            int[] nums_2 = {3, 2, 4};
            int target_2 = 6;
            int[] result_2 = solution.twoSum(nums_2, target_2);
            System.out.println(gson.toJson(result_2));
        } catch (Exception e) {
            System.out.println("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }
}
```

## Database Schema Changes

### Problems Table
```sql
ALTER TABLE problems 
DROP COLUMN grading_mode,  -- No longer needed
ADD COLUMN parameter_types TEXT[];  -- ["int[]", "int"]
```

### Test Cases Table
```sql
ALTER TABLE test_cases
DROP COLUMN input_data,
DROP COLUMN expected_output,
ADD COLUMN inputs JSONB NOT NULL,  -- Array of {type, value} objects
ADD COLUMN expected_output JSONB NOT NULL;  -- {type, value} object
```

### Example Data
```sql
INSERT INTO test_cases (problem_id, inputs, expected_output, is_hidden, points)
VALUES (
    1,
    '[
        {"type": "int[]", "value": [2, 7, 11, 15]},
        {"type": "int", "value": 9}
    ]'::jsonb,
    '{"type": "int[]", "value": [0, 1]}'::jsonb,
    false,
    50
);
```

## Benefits

1. **Language Agnostic**: Input parsing is handled by test harness, not student code
2. **Type Safe**: Clear type definitions prevent input format errors
3. **Professional**: Matches industry-standard platforms (LeetCode, HackerRank)
4. **Extensible**: Easy to add complex data structures
5. **Simpler**: Single grading mode instead of two
6. **Better UX**: Students focus on algorithm, not I/O handling

## Migration Strategy

Since we're replacing the old system completely:
1. Update database schema
2. Update worker grading logic
3. Update backend API
4. Update frontend UI
5. Add JSON libraries to sandbox containers
6. Test thoroughly before deploying

## Future Enhancements

- Custom data structures (LinkedList, TreeNode, etc.)
- Graph representations
- Multiple output formats (void functions with modified parameters)
- Interactive debugging with step-by-step execution
