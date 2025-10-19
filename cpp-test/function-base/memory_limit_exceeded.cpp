// Test case: Memory Limit Exceeded - Allocating too much memory
#include <iostream>
#include <vector>
using namespace std;

vector<int> createHugeArray(int size) {
    vector<int> arr;
    // Allocate huge amount of memory
    for (int i = 0; i < size * 1000000; i++) {
        arr.push_back(i);
    }
    return arr;
}

int* allocateMemory(int n) {
    // Allocate massive array without freeing
    int* arr = new int[n * 1000000];
    return arr;
}
