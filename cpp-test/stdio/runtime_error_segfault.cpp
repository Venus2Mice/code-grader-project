// Test case: Runtime Error - Segmentation fault from pointer
#include <iostream>
using namespace std;

int main() {
    int* ptr = nullptr;
    int n;
    cin >> n;
    
    if (n > 0) {
        ptr = new int[n];
        for (int i = 0; i < n; i++) {
            cin >> ptr[i];
        }
    }
    
    // Always dereference - causes crash when n <= 0
    cout << *ptr << endl;
    
    return 0;
}
