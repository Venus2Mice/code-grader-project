// Test case: Runtime Error - Array out of bounds
#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    int arr[100];
    
    // Read n elements
    for (int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    
    // Access invalid index
    cout << arr[n + 100] << endl;  // Out of bounds access
    
    return 0;
}
