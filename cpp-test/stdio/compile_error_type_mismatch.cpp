// Test case: Compile Error - Type mismatch
#include <iostream>
#include <string>
using namespace std;

int main() {
    string text;
    int number;
    cin >> text;
    number = text;  // Error: cannot convert string to int
    cout << number * 2 << endl;
    return 0;
}
