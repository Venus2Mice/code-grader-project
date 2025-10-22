// Test case: Time Limit Exceeded - Exponential time complexity
#include <iostream>
using namespace std;

// Naive recursive fibonacci - O(2^n) complexity
int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// Inefficient prime checking
bool isPrime(int n) {
    if (n < 2) return false;
    for (int i = 2; i < n; i++) {
        for (int j = 2; j < n; j++) {  // Unnecessary nested loop
            if (i * j == n) return false;
        }
    }
    return true;
}
