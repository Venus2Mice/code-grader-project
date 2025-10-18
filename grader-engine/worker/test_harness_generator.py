"""
Module để generate test harness code cho function-based grading
Wrap student's function với code để parse input, execute, và so sánh output
"""

from typing import Dict, List

# Try relative import first (when used as module), fallback to direct import (when run standalone)
try:
    from .function_parser import FunctionSignatureParser
except ImportError:
    from function_parser import FunctionSignatureParser


class TestHarnessGenerator:
    """Generator cho test harness code"""
    
    # Template cho các loại data type khác nhau
    INPUT_PARSERS = {
        'int': 'int {var}; cin >> {var};',
        'long': 'long {var}; cin >> {var};',
        'long long': 'long long {var}; cin >> {var};',
        'double': 'double {var}; cin >> {var};',
        'float': 'float {var}; cin >> {var};',
        'char': 'char {var}; cin >> {var};',
        'bool': 'bool {var}; cin >> {var};',
        'string': 'string {var}; cin >> {var};',
    }
    
    @staticmethod
    def generate(parsed_signature: Dict, student_code: str) -> str:
        """
        Generate complete test harness code
        
        Args:
            parsed_signature: Dict từ FunctionSignatureParser.parse()
            student_code: Source code của học sinh (chỉ chứa function implementation)
        
        Returns:
            Complete C++ code với main() để test
        """
        if not parsed_signature:
            return ""
        
        return_type = parsed_signature['return_type']
        function_name = parsed_signature['function_name']
        parameters = parsed_signature['parameters']
        
        # Bắt đầu generate code
        code_parts = []
        
        # 1. Headers
        code_parts.append(TestHarnessGenerator._generate_headers())
        
        # 2. Student's function code
        code_parts.append("// ========== STUDENT CODE ==========")
        code_parts.append(student_code)
        code_parts.append("// ========== END STUDENT CODE ==========\n")
        
        # 3. Main function
        code_parts.append("int main() {")
        code_parts.append("    try {")
        
        # 4. Input parsing
        input_parsing = TestHarnessGenerator._generate_input_parsing(parameters)
        code_parts.append(input_parsing)
        
        # 5. Function call
        function_call = TestHarnessGenerator._generate_function_call(
            return_type, function_name, parameters
        )
        code_parts.append(function_call)
        
        # 6. Output printing
        output_printing = TestHarnessGenerator._generate_output_printing(return_type)
        code_parts.append(output_printing)
        
        # 7. Exception handling
        code_parts.append("    } catch (const exception& e) {")
        code_parts.append('        cerr << "Runtime Error: " << e.what() << endl;')
        code_parts.append("        return 1;")
        code_parts.append("    } catch (...) {")
        code_parts.append('        cerr << "Unknown Runtime Error" << endl;')
        code_parts.append("        return 1;")
        code_parts.append("    }")
        code_parts.append("    return 0;")
        code_parts.append("}")
        
        return '\n'.join(code_parts)
    
    @staticmethod
    def _generate_headers() -> str:
        """Generate necessary C++ headers"""
        headers = [
            "#include <iostream>",
            "#include <vector>",
            "#include <string>",
            "#include <algorithm>",
            "#include <map>",
            "#include <set>",
            "#include <queue>",
            "#include <stack>",
            "#include <deque>",
            "#include <list>",
            "#include <utility>",
            "#include <sstream>",
            "#include <iomanip>",
            "#include <cmath>",
            "#include <exception>",
            "",
            "using namespace std;",
            ""
        ]
        return '\n'.join(headers)
    
    @staticmethod
    def _generate_input_parsing(parameters: List[tuple]) -> str:
        """
        Generate code để parse input cho các parameters
        
        Hỗ trợ:
        - Primitive types: int, long, double, string, etc.
        - vector<T>: format [1,2,3] hoặc size theo sau là elements
        - Tự động detect type và generate appropriate parsing code
        """
        if not parameters:
            return ""
        
        lines = ["        // Parse input"]
        
        for param_type, param_name in parameters:
            parsing_code = TestHarnessGenerator._parse_single_parameter(param_type, param_name)
            lines.append(f"        {parsing_code}")
        
        lines.append("")
        return '\n'.join(lines)
    
    @staticmethod
    def _parse_single_parameter(param_type: str, param_name: str) -> str:
        """Generate parsing code cho một parameter"""
        
        # Remove reference and const
        clean_type = param_type.replace('&', '').replace('const', '').strip()
        
        # Check for vector
        if clean_type.startswith('vector<'):
            inner_type = TestHarnessGenerator._extract_template_type(clean_type)
            return TestHarnessGenerator._parse_vector(inner_type, param_name)
        
        # Check for primitive types
        if clean_type in TestHarnessGenerator.INPUT_PARSERS:
            return TestHarnessGenerator.INPUT_PARSERS[clean_type].format(var=param_name)
        
        # Default: try to read as string
        return f'string {param_name}; cin >> {param_name};'
    
    @staticmethod
    def _parse_vector(inner_type: str, var_name: str) -> str:
        """
        Generate code để parse vector
        Format: đọc size trước, rồi đọc từng element
        """
        clean_inner = inner_type.replace('&', '').replace('const', '').strip()
        
        return f'''int {var_name}_size;
        cin >> {var_name}_size;
        vector<{clean_inner}> {var_name}({var_name}_size);
        for (int i = 0; i < {var_name}_size; i++) {{
            cin >> {var_name}[i];
        }}'''
    
    @staticmethod
    def _extract_template_type(type_str: str) -> str:
        """Extract inner type từ template type như 'vector<int>' -> 'int'"""
        start = type_str.find('<')
        end = type_str.rfind('>')
        if start != -1 and end != -1:
            return type_str[start + 1:end].strip()
        return 'int'  # default
    
    @staticmethod
    def _generate_function_call(return_type: str, function_name: str, parameters: List[tuple]) -> str:
        """Generate code để call student's function"""
        
        param_names = [name for _, name in parameters]
        args = ', '.join(param_names)
        
        clean_return_type = return_type.replace('&', '').replace('const', '').strip()
        
        if clean_return_type == 'void':
            return f"        // Call function\n        {function_name}({args});\n"
        else:
            return f"        // Call function\n        {clean_return_type} result = {function_name}({args});\n"
    
    @staticmethod
    def _generate_output_printing(return_type: str) -> str:
        """Generate code để print output của function"""
        
        clean_return_type = return_type.replace('&', '').replace('const', '').strip()
        
        if clean_return_type == 'void':
            return '        cout << "void function executed successfully" << endl;'
        
        # Check for vector
        if clean_return_type.startswith('vector<'):
            inner_type = TestHarnessGenerator._extract_template_type(clean_return_type)
            return TestHarnessGenerator._print_vector('result')
        
        # Check for pair
        if clean_return_type.startswith('pair<'):
            return '        cout << result.first << " " << result.second << endl;'
        
        # Primitive types
        return '        cout << result << endl;'
    
    @staticmethod
    def _print_vector(var_name: str) -> str:
        """Generate code để print vector"""
        return f'''        // Print vector result
        for (size_t i = 0; i < {var_name}.size(); i++) {{
            if (i > 0) cout << " ";
            cout << {var_name}[i];
        }}
        cout << endl;'''
    
    @staticmethod
    def format_input_data(parsed_signature: Dict, input_values: List) -> str:
        """
        Format input values thành string theo format mà test harness expect
        
        Args:
            parsed_signature: Dict từ FunctionSignatureParser.parse()
            input_values: List of input values (có thể là primitives hoặc lists)
        
        Returns:
            Formatted input string
        """
        parameters = parsed_signature['parameters']
        
        if len(input_values) != len(parameters):
            raise ValueError(f"Input values count ({len(input_values)}) doesn't match parameters count ({len(parameters)})")
        
        lines = []
        
        for (param_type, param_name), value in zip(parameters, input_values):
            clean_type = param_type.replace('&', '').replace('const', '').strip()
            
            if clean_type.startswith('vector<'):
                # For vector: write size first, then elements
                if isinstance(value, (list, tuple)):
                    lines.append(str(len(value)))
                    lines.extend([str(v) for v in value])
                else:
                    raise ValueError(f"Expected list/tuple for vector parameter, got {type(value)}")
            else:
                # For primitive types: just write the value
                lines.append(str(value))
        
        return '\n'.join(lines)


# Test nếu chạy trực tiếp
if __name__ == "__main__":
    from function_parser import FunctionSignatureParser
    
    # Test case 1: Simple int function
    sig1 = "int add(int a, int b)"
    parsed1 = FunctionSignatureParser.parse(sig1)
    student_code1 = """
int add(int a, int b) {
    return a + b;
}
"""
    
    print("=" * 60)
    print("Test 1: Simple int function")
    print("=" * 60)
    harness1 = TestHarnessGenerator.generate(parsed1, student_code1)
    print(harness1)
    
    # Test case 2: Vector function
    sig2 = "vector<int> twoSum(vector<int>& nums, int target)"
    parsed2 = FunctionSignatureParser.parse(sig2)
    student_code2 = """
vector<int> twoSum(vector<int>& nums, int target) {
    vector<int> result;
    for (int i = 0; i < nums.size(); i++) {
        for (int j = i + 1; j < nums.size(); j++) {
            if (nums[i] + nums[j] == target) {
                result.push_back(i);
                result.push_back(j);
                return result;
            }
        }
    }
    return result;
}
"""
    
    print("\n" + "=" * 60)
    print("Test 2: Vector function")
    print("=" * 60)
    harness2 = TestHarnessGenerator.generate(parsed2, student_code2)
    print(harness2)
    
    # Test input formatting
    print("\n" + "=" * 60)
    print("Test 3: Input formatting")
    print("=" * 60)
    input_str = TestHarnessGenerator.format_input_data(parsed2, [[2, 7, 11, 15], 9])
    print("Formatted input:")
    print(input_str)
