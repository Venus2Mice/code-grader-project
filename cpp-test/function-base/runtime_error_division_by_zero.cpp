// Test case: Runtime Error - Division by zero
#include <iostream>
using namespace std;

int divide(int a, int b) {
    return a / b;  // Will cause runtime error if b = 0
}

double calculateAverage(int sum, int count) {
    return sum / count;  // Runtime error if count = 0
}
