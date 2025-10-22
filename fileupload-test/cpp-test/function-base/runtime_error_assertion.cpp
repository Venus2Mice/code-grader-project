// Test case: Runtime Error - Assertion Failure
// Using assert() to verify behavior
#include <iostream>
#include <cassert>
using namespace std;

int getValue(int index) {
    assert(index >= 0);  // Will fail if index < 0
    return index * 10;
}

int safeDivide(int a, int b) {
    assert(b != 0);  // Will fail if b = 0
    return a / b;
}
