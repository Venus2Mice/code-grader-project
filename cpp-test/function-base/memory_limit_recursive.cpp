// Test case: Memory Limit Exceeded - Stack overflow from deep recursion
#include <iostream>
using namespace std;

int deepRecursion(int n) {
    if (n == 0) return 0;
    int arr[10000];  // Large local array on each recursive call
    for (int i = 0; i < 10000; i++) {
        arr[i] = i;
    }
    return arr[n % 10000] + deepRecursion(n - 1);
}

void infiniteRecursion(int n) {
    int localData[1000];
    infiniteRecursion(n + 1);  // No base case - stack overflow
}
