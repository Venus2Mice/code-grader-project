# Agent Guidelines

## Core Principles

### 1. Documentation Policy
- **DO NOT** create reports or markdown documentation files unless explicitly requested by the user
- Focus on code implementation rather than excessive documentation

### 2. Task Management
- **ALWAYS** create a todo list after identifying tasks that need to be completed
- Break down complex tasks into smaller, manageable items
- Use the todo list tool to track progress

### 3. Completion Reporting
- **ALWAYS** provide a summary of completed work when all tasks are finished
- Include:
  - What was accomplished
  - Files created/modified
  - Any important notes or warnings
  - Next steps (if applicable)

## Workflow

1. **Understand** the user's request
2. **Plan** by creating a todo list
3. **Execute** tasks one by one
4. **Update** todo list as you progress
5. **Summarize** upon completion

## Best Practices

- Keep communication concise and focused on the task
- Ask clarifying questions when requirements are unclear
- Test changes when possible before reporting completion
- Prioritize working code over documentation

## Design Principles

### 1. Neo Brutalism Design
**MUST** follow Neo Brutalism Design principles for all UI implementations:

- **Bold and Raw Aesthetics**
  - Use thick, prominent borders (typically 3-5px solid black)
  - High contrast color schemes
  - Flat, non-gradient backgrounds
  - Sharp corners and geometric shapes

- **Typography**
  - Bold, sans-serif fonts
  - Large, clear text hierarchy
  - Black text on bright backgrounds or vice versa

- **Layout**
  - Grid-based layouts with clear separation
  - Generous spacing and padding
  - Overlapping elements with solid shadows
  - Asymmetric compositions when appropriate

- **Interaction**
  - Clear, immediate feedback on user actions
  - Prominent buttons with bold styling
  - Visible state changes (hover, active, disabled)

- **Color Palette**
  - Primary: Bright, saturated colors (yellow, cyan, pink, lime)
  - Contrast: Black and white
  - Accents: Use sparingly for emphasis
  - Avoid gradients and subtle transitions

### 2. Code Review Requirement
**MUST** review code after completing any feature or making changes:

- **After Every Feature Implementation**
  - Review code structure and architecture
  - Check SOLID principles adherence
  - Verify error handling and edge cases
  - Ensure proper logging and monitoring
  - Test integration with existing features

- **After Code Changes**
  - Review impact on existing functionality
  - Check for breaking changes
  - Verify backward compatibility
  - Update tests if necessary
  - Document significant changes in code comments

- **Review Checklist**
  - [ ] Code follows project conventions
  - [ ] No code duplication
  - [ ] Proper error handling
  - [ ] Security considerations addressed
  - [ ] Performance implications considered
  - [ ] Tests updated/added
  - [ ] Documentation updated if needed

### 3. SOLID Principles
**MUST** follow SOLID principles in all code implementations:

#### 1. Single Responsibility Principle (SRP)
- Each module/class should have only one reason to change
- Example: Separate grading logic, Docker operations, and database access

#### 2. Open-Closed Principle (OCP)
- Open for extension, closed for modification
- Use interfaces and abstractions to allow new features without changing existing code
- Example: Language handlers can be added without modifying grading service

#### 3. Liskov Substitution Principle (LSP)
- Subtypes must be substitutable for their base types
- All language handlers must implement the same interface correctly

#### 4. Interface Segregation Principle (ISP)
- Clients should not depend on interfaces they don't use
- Create focused, minimal interfaces rather than large general-purpose ones
- Example: Separate interfaces for stdio vs function-based grading

#### 5. Dependency Inversion Principle (DIP)
- Depend on abstractions, not concretions
- High-level modules should not depend on low-level modules
- Example: Grading service depends on LanguageHandler interface, not concrete handlers

---

## Fix Strategy Policy

### When Facing Multiple Fix Options

**PRIORITY ORDER:**

1. **Extensibility First**
   - Choose the solution that allows for future expansion
   - Avoid hacky/temporary solutions
   - Example: Refactor architecture instead of quick patch

2. **Redesign When Necessary**
   - If the old design does not fit → change it
   - Don't keep wrong architecture just to avoid refactoring
   - Example: Function-based grading → from "run per test case" → "run once, parse output"

3. **Long-term Maintainability**
   - Code will be maintained for a long time → must be easy to understand and modify
   - Performance optimization if needed, but make it clear in comments
   - Document decisions in code comments if not obvious

### Applied Fixes

**Function-Based Grading Output Parsing (Oct 22, 2025):**
- **Old Design**: Run test harness multiple times (once per test case)
  - Problem: Inefficient (recompile/re-exec per test case)
- **Alternative 1**: Add output markers (TEST_1, TEST_2)
  - Problem: Hard to parse, error-prone
- **Selected: Alternative 2** ✅ (BEST): Run once, parse output lines
  - Solution: Test harness runs all test cases once, outputs N lines
  - Backend parses one line per test case
  - Files modified: `grader-engine-go/internal/grader/function.go`
  - Benefits: Efficient, clean, extensible, maintainable

---

## Architecture Decisions

### Function Signature Elimination (Oct 31, 2025)

**Decision**: Removed function signature parsing and replaced with type inference from test cases.

**Rationale**:
- Mixed signature formats in database (Python/C++/Java) caused parsing errors
- Signature parsing added unnecessary complexity
- Test cases already contain all type information needed

**New Approach**:
1. **Teacher Input**: Only function name (e.g., "twoSum")
2. **Type Inference**: Automatically detect:
   - Parameter count and types from test case `inputs`
   - Return type from test case `expected_output`
3. **Code Injection**: Simple placeholder replacement (`# STUDENT_CODE_HERE`)

**Example**:
```json
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

**Generated Signature** (auto):
- Python: `def twoSum(param0: List[int], param1: int) -> List[int]:`
- C++: `vector<int> twoSum(const vector<int>& param0, int param1)`
- Java: `public int[] twoSum(int[] param0, int param1)`

**Benefits**:
- ✅ No signature parsing errors
- ✅ Consistent behavior across languages
- ✅ Simpler teacher workflow (only set function name)
- ✅ Type safety guaranteed by test cases

**Files Modified**:
- `grader-engine-go/internal/generator/type_inference.go` (NEW)
- `grader-engine-go/internal/generator/harness_python_v2.go` (NEW)
- `grader-engine-go/internal/generator/harness_cpp_v2.go` (NEW)
- `grader-engine-go/internal/generator/harness_java_v2.go` (NEW)
- `grader-engine-go/internal/generator/inject.go` (SIMPLIFIED)
- `grader-engine-go/internal/generator/harness.go` (REFACTORED)

---

*This file serves as guidelines for AI agents working on this project.*
