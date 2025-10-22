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

### SOLID Principles
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

*This file serves as guidelines for AI agents working on this project.*
