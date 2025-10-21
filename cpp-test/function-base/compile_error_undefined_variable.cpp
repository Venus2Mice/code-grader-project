// Test case: Compile Error - Undefined variable
#include <iostream>
using namespace std;

int calculateSum(int n) {
    int sum = 0;
    for (int i = 0; i <= n; i++) {
        sum += i;
    }
    return sum + undefinedVar;  // Undefined variable
}
