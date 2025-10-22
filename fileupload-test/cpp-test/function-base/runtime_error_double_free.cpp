// Test case: Runtime Error - Double Free
// (Attempting to free memory twice)
#include <iostream>
#include <cstdlib>
using namespace std;

int* createArray(int size) {
    int* arr = new int[size];
    return arr;
}

void deleteArray(int* arr) {
    delete[] arr;
    // Intentionally calling delete again would be double free
    // But that's hard to trigger in a function
    // Instead, we'll use a function that deletes and then tries to dereference
}

// Better: Memory use-after-free
int* badPointerFunc() {
    int* ptr = new int(42);
    delete ptr;
    return ptr;  // Returns deleted pointer - accessing it will cause segfault
}
