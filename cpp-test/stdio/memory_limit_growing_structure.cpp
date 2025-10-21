// Test case: Memory Limit Exceeded - Growing data structure
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    
    vector<vector<int>> matrix;
    
    // Create massive 2D structure
    for (int i = 0; i < n; i++) {
        vector<int> row;
        for (int j = 0; j < n * 1000; j++) {
            row.push_back(i * j);
        }
        matrix.push_back(row);
    }
    
    cout << matrix.size() << endl;
    
    return 0;
}
