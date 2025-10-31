# Migration Guide: Function Signature → Function Name

## Overview
**Date**: October 31, 2025  
**Author**: AI Agent  
**Purpose**: Migrate from complex function signature parsing to simple function name + type inference

## What Changed

### Before (OLD)
```python
problem = {
    "function_signature": "def twoSum(nums: List[int], target: int) -> List[int]:"
}
```
- ❌ Required valid Python/C++/Java syntax
- ❌ Parsing errors with mixed formats
- ❌ Complex validation logic

### After (NEW)
```python
problem = {
    "function_name": "twoSum",
    "function_signature": null  # Deprecated, no longer used
}
```
- ✅ Simple function name only
- ✅ Types inferred from test cases
- ✅ No parsing errors

## Database Changes

### Schema (Already exists)
```sql
ALTER TABLE problems 
ADD COLUMN function_name VARCHAR(100);
```

✅ **No migration needed** - column already exists!

### Backward Compatibility
The system supports **both** approaches:
1. If `function_name` is set → use it
2. If `function_name` is empty → extract from `function_signature` (fallback)

## API Changes

### Problem Creation (No Breaking Changes)

**Option 1**: New approach (recommended)
```python
POST /api/classes/:id/problems
{
    "title": "Two Sum",
    "function_name": "twoSum",  # NEW: Simple function name
    "test_cases": [
        {
            "inputs": [
                {"type": "int[]", "value": [2,7,11,15]},
                {"type": "int", "value": 9}
            ],
            "expected_output": {"type": "int[]", "value": [0,1]}
        }
    ]
}
```

**Option 2**: Old approach (still works)
```python
POST /api/classes/:id/problems
{
    "title": "Two Sum",
    "function_signature": "def twoSum(nums: List[int], target: int) -> List[int]:",
    "test_cases": [...]
}
```
→ System will extract "twoSum" from signature automatically

## Frontend Changes Needed

### Problem Creation Form

**Before**:
```jsx
<textarea 
    label="Function Signature"
    placeholder="def twoSum(nums: List[int], target: int) -> List[int]:"
/>
```

**After**:
```jsx
<input 
    label="Function Name"
    placeholder="twoSum"
    pattern="[a-zA-Z_][a-zA-Z0-9_]*"
/>
```

### UI Mockup
```
┌─────────────────────────────────────────┐
│ Problem Details                         │
├─────────────────────────────────────────┤
│                                         │
│ Title: [Two Sum              ]          │
│                                         │
│ Function Name: [twoSum       ] ← NEW!  │
│                                         │
│ Difficulty: [Medium ▼]                 │
│                                         │
│ Test Cases:                             │
│ ┌─────────────────────────────────────┐ │
│ │ Input 1:  Type: [int[] ▼]          │ │
│ │           Value: [2,7,11,15]        │ │
│ │                                     │ │
│ │ Input 2:  Type: [int ▼]            │ │
│ │           Value: [9]                │ │
│ │                                     │ │
│ │ Expected: Type: [int[] ▼]          │ │
│ │           Value: [0,1]              │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Testing Strategy

### 1. Unit Tests (✅ Done)
```bash
cd grader-engine-go
go test ./internal/generator -v
```

**Results**: All 15+ tests passing

### 2. Integration Tests
```bash
# Create problem with function_name
curl -X POST /api/classes/1/problems \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Problem",
    "function_name": "testFunc",
    "test_cases": [...]
  }'

# Submit solution
curl -X POST /api/problems/123/submit \
  -d '{"source_code": "return param0 + param1", "language": "python"}'
```

### 3. Regression Tests
- ✅ Old problems with `function_signature` still work
- ✅ New problems with `function_name` work
- ✅ Mixed database (old + new) works

## Rollout Plan

### Phase 1: Backend Ready (✅ Complete)
- [x] Type inference implemented
- [x] Backward compatibility ensured
- [x] Tests passing

### Phase 2: Frontend Update (TODO)
- [ ] Update problem creation form
- [ ] Change "Function Signature" → "Function Name"
- [ ] Add validation (alphanumeric + underscore)
- [ ] Update problem edit form

### Phase 3: Data Migration (OPTIONAL)
- [ ] Backfill `function_name` for old problems
- [ ] SQL script to extract names from signatures

```sql
-- Optional migration script
UPDATE problems 
SET function_name = 
    CASE 
        WHEN function_signature LIKE 'def %' THEN 
            substring(function_signature from 'def ([a-zA-Z_][a-zA-Z0-9_]*)')
        WHEN function_signature LIKE '%public%' THEN 
            substring(function_signature from 'public [a-zA-Z<>\[\]]+\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(')
        ELSE 
            substring(function_signature from '([a-zA-Z_][a-zA-Z0-9_]*)\s*\(')
    END
WHERE function_name IS NULL OR function_name = '';
```

### Phase 4: Deprecation (FUTURE)
- [ ] Mark `function_signature` as deprecated in API docs
- [ ] Add warning when using old approach
- [ ] Eventually remove `function_signature` column (6+ months)

## Examples

### Two Sum Problem
```python
{
    "function_name": "twoSum",
    "test_cases": [{
        "inputs": [
            {"type": "int[]", "value": [2,7,11,15]},
            {"type": "int", "value": 9}
        ],
        "expected_output": {"type": "int[]", "value": [0,1]}
    }]
}
```

**Generated Signatures**:
- Python: `def twoSum(param0: List[int], param1: int) -> List[int]:`
- C++: `vector<int> twoSum(const vector<int>& param0, int param1)`
- Java: `public int[] twoSum(int[] param0, int param1)`

### Palindrome Check
```python
{
    "function_name": "isPalindrome",
    "test_cases": [{
        "inputs": [{"type": "int", "value": 121}],
        "expected_output": {"type": "bool", "value": true}
    }]
}
```

**Generated Signatures**:
- Python: `def isPalindrome(param0: int) -> bool:`
- C++: `bool isPalindrome(int param0)`
- Java: `public boolean isPalindrome(int param0)`

### Reverse String (Void Return)
```python
{
    "function_name": "reverseString",
    "test_cases": [{
        "inputs": [{"type": "string[]", "value": ["h","e","l","l","o"]}],
        "expected_output": {"type": "void", "value": null}
    }]
}
```

**Generated Signatures**:
- Python: `def reverseString(param0: List[str]) -> None:`
- C++: `void reverseString(vector<string>& param0)`
- Java: `public void reverseString(String[] param0)`

## Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Teacher Workflow** | Write complex signatures | Enter simple function name |
| **Error Prone** | ❌ Signature syntax errors | ✅ Simple name validation |
| **Multi-language** | ❌ Must know all syntaxes | ✅ One name, auto-generate |
| **Maintenance** | ❌ Complex parsing logic | ✅ Simple type mapping |
| **Type Safety** | ⚠️ From signature | ✅ From test cases |

## FAQ

**Q: Do I need to update existing problems?**  
A: No, backward compatibility is maintained. Old problems work fine.

**Q: What happens if both `function_name` and `function_signature` are set?**  
A: `function_name` takes priority.

**Q: Can students still submit complete function definitions?**  
A: Yes! The injection logic handles both:
- Function body only: Injected into template
- Complete function: Used as-is

**Q: What about custom parameter names?**  
A: Currently uses `param0`, `param1`, etc. Can be enhanced later.

## Support

For issues or questions, check:
- Test files: `grader-engine-go/internal/generator/*_test.go`
- Implementation: `grader-engine-go/internal/generator/type_inference.go`
- Documentation: `AGENTS.md`
