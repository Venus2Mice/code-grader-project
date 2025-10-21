// Test case: Memory Limit Exceeded - Memory leak
#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    
    // Continuously allocate without freeing
    for (int i = 0; i < n; i++) {
        int* arr = new int[1000000];
        for (int j = 0; j < 1000000; j++) {
            arr[j] = j;
        }
        // Memory leak - never delete arr
    }
    
    cout << "Done" << endl;
    
    return 0;
}
