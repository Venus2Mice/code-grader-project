// Test case: Memory Limit Exceeded - Allocating huge array
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    
    // Allocate massive memory
    vector<int> hugeVector(n * 1000000);
    
    for (int i = 0; i < hugeVector.size(); i++) {
        hugeVector[i] = i;
    }
    
    cout << hugeVector.size() << endl;
    
    return 0;
}
