// Test case: Time Limit Exceeded - Infinite loop
#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    
    int i = 0;
    while (i < n) {
        cout << i << " ";
        // Missing i++ - infinite loop
    }
    cout << endl;
    
    return 0;
}
