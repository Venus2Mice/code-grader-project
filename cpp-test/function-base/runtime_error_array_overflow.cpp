// Test case: Runtime Error - Array index out of bounds
#include <iostream>
using namespace std;

int getElement(int arr[], int size, int index) {
    return arr[index];  // No bounds checking - can cause segmentation fault
}

int sumArray(int arr[], int size) {
    int sum = 0;
    for (int i = 0; i <= size; i++) {  // Off-by-one error - i <= size will overflow
        sum += arr[i];
    }
    return sum;
}
