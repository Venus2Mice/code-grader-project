// Test case: Runtime Error - Stack overflow
#include <iostream>
using namespace std;

void recursiveFunction(int n) {
    int largeArray[100000];  // Large stack allocation
    if (n > 0) {
        recursiveFunction(n - 1);
    }
}

int main() {
    int n;
    cin >> n;
    recursiveFunction(n);  // Will cause stack overflow with large n
    cout << "Done" << endl;
    return 0;
}
