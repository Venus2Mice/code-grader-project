// Test case: Time Limit Exceeded - Infinite loop
#include <iostream>
using namespace std;

int calculateSum(int n) {
    int sum = 0;
    int i = 0;
    while (i < n) {
        sum += i;
        // Missing i++ - infinite loop
    }
    return sum;
}

int findMax(int arr[], int size) {
    int max = arr[0];
    for (int i = 0; ; i++) {  // Infinite loop - no termination condition
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    return max;
}
