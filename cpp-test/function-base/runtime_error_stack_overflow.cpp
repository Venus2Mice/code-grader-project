// Test case: Runtime Error - Stack Overflow (Deep Recursion)
#include <iostream>
using namespace std;

// Function that will cause stack overflow due to infinite recursion
int infiniteRecursion(int n) {
    return infiniteRecursion(n + 1);  // Always recurse without base case
}

// Function to check proper recursion
int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
