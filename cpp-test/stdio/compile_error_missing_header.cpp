// Test case: Compile Error - Missing header
#include <iostream>
// Missing <vector> header
using namespace std;

int main() {
    vector<int> nums;  // Error: vector not declared
    int n;
    cin >> n;
    for (int i = 0; i < n; i++) {
        nums.push_back(i);
    }
    return 0;
}
