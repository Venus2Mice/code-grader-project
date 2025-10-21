// Test case: Runtime Error - Division by zero
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a / b << endl;  // Runtime error when b = 0
    return 0;
}
