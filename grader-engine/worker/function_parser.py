"""
Module để parse C++ function signature thành các component
Hỗ trợ các loại signature phức tạp như template types, references, pointers
"""

import re
from typing import Dict, List, Tuple, Optional


class FunctionSignatureParser:
    """Parser cho C++ function signatures"""
    
    @staticmethod
    def parse(signature: str) -> Optional[Dict]:
        """
        Parse C++ function signature thành các components
        
        Args:
            signature: C++ function signature
            Ví dụ: "vector<int> twoSum(vector<int>& nums, int target)"
        
        Returns:
            Dict chứa:
            - return_type: kiểu trả về (ví dụ: "vector<int>")
            - function_name: tên hàm (ví dụ: "twoSum")
            - parameters: list of tuples (type, name)
                Ví dụ: [("vector<int>&", "nums"), ("int", "target")]
            
            Trả về None nếu không parse được
        """
        if not signature or not signature.strip():
            return None
        
        signature = signature.strip()
        
        try:
            # Tìm vị trí dấu ngoặc đầu tiên
            paren_pos = signature.find('(')
            if paren_pos == -1:
                return None
            
            # Tách phần trước ngoặc (return_type + function_name)
            before_paren = signature[:paren_pos].strip()
            
            # Tách return_type và function_name
            # Tìm từ cuối cùng làm function_name
            parts = before_paren.split()
            if len(parts) < 2:
                return None
            
            function_name = parts[-1]
            return_type = ' '.join(parts[:-1])
            
            # Tìm vị trí đóng ngoặc cuối cùng
            close_paren = signature.rfind(')')
            if close_paren == -1:
                return None
            
            # Lấy phần parameters
            params_str = signature[paren_pos + 1:close_paren].strip()
            
            # Parse parameters
            parameters = FunctionSignatureParser._parse_parameters(params_str)
            
            return {
                'return_type': return_type,
                'function_name': function_name,
                'parameters': parameters
            }
            
        except Exception as e:
            print(f"Error parsing signature '{signature}': {e}")
            return None
    
    @staticmethod
    def _parse_parameters(params_str: str) -> List[Tuple[str, str]]:
        """
        Parse parameter string thành list of (type, name) tuples
        
        Args:
            params_str: string chứa parameters
            Ví dụ: "vector<int>& nums, int target"
        
        Returns:
            List of tuples: [("vector<int>&", "nums"), ("int", "target")]
        """
        if not params_str or params_str.strip() == '':
            return []
        
        parameters = []
        
        # Split by comma, nhưng phải chú ý đến template brackets
        param_list = FunctionSignatureParser._smart_split(params_str, ',')
        
        for param in param_list:
            param = param.strip()
            if not param:
                continue
            
            # Tách type và name
            # Lấy từ cuối cùng làm name
            parts = param.split()
            if len(parts) < 2:
                # Trường hợp không có tên biến (chỉ có type)
                # Tự sinh tên
                param_type = param
                param_name = f"param{len(parameters)}"
            else:
                param_name = parts[-1]
                param_type = ' '.join(parts[:-1])
            
            parameters.append((param_type, param_name))
        
        return parameters
    
    @staticmethod
    def _smart_split(text: str, delimiter: str) -> List[str]:
        """
        Split string by delimiter, nhưng không split nếu delimiter nằm trong < >
        
        Ví dụ: "vector<int, int>, string" split by ',' -> ["vector<int, int>", "string"]
        """
        result = []
        current = []
        bracket_depth = 0
        
        for char in text:
            if char == '<':
                bracket_depth += 1
                current.append(char)
            elif char == '>':
                bracket_depth -= 1
                current.append(char)
            elif char == delimiter and bracket_depth == 0:
                result.append(''.join(current))
                current = []
            else:
                current.append(char)
        
        if current:
            result.append(''.join(current))
        
        return result
    
    @staticmethod
    def generate_function_declaration(parsed_sig: Dict) -> str:
        """
        Generate C++ function declaration từ parsed signature
        
        Args:
            parsed_sig: Dict từ parse()
        
        Returns:
            C++ function declaration string
        """
        if not parsed_sig:
            return ""
        
        params = ', '.join([f"{ptype} {pname}" for ptype, pname in parsed_sig['parameters']])
        return f"{parsed_sig['return_type']} {parsed_sig['function_name']}({params})"


# Test cases nếu chạy trực tiếp
if __name__ == "__main__":
    # Test parser
    test_signatures = [
        "int add(int a, int b)",
        "vector<int> twoSum(vector<int>& nums, int target)",
        "string longestPalindrome(string s)",
        "vector<vector<int>> threeSum(vector<int>& nums)",
        "bool isPalindrome(string s)",
        "void printArray(int arr[], int size)",
        "pair<int, int> findMinMax(vector<int>& nums)",
        "map<string, int> countWords(string text)",
    ]
    
    parser = FunctionSignatureParser()
    
    for sig in test_signatures:
        print(f"\nTesting: {sig}")
        result = parser.parse(sig)
        if result:
            print(f"  Return type: {result['return_type']}")
            print(f"  Function name: {result['function_name']}")
            print(f"  Parameters: {result['parameters']}")
            print(f"  Declaration: {parser.generate_function_declaration(result)}")
        else:
            print("  Failed to parse!")
