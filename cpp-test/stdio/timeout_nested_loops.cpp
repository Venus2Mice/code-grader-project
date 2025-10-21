// Test case: Time Limit Exceeded - Nested loops with large input
#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    
    // O(n^3) complexity - will timeout with large n
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            for (int k = 0; k < n; k++) {
                cout << i + j + k << " ";
            }
        }
    }
    cout << endl;
    
    return 0;
}
