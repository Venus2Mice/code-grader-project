// Test case: Runtime Error - Modulo by Zero
#include <iostream>
using namespace std;

int modulo(int a, int b) {
    return a % b;  // Will cause SIGFPE if b = 0
}

int remainder(int x, int y) {
    return x % y;  // Runtime error if y = 0
}
