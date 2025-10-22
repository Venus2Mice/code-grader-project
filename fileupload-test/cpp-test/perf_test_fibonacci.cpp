// Performance Test: Fibonacci Calculation with Heavy Computation
// Expected time: 1-5 seconds (depending on input)
// Expected memory: 2-4 MB
// Purpose: Test accurate time and memory measurement for slow algorithms

#include <iostream>
#include <vector>
#include <cmath>
using namespace std;

// Calculate Fibonacci with VERY heavy computation for testing
long long fibonacci_slow(int n) {
    if (n <= 1) return n;
    
    // Allocate memory vector (~2-3 MB)
    vector<long long> fib(n + 1);
    fib[0] = 0;
    fib[1] = 1;
    
    // Calculate Fibonacci with HEAVY computation to take 1-5 seconds
    for (int i = 2; i <= n; i++) {
        fib[i] = (fib[i-1] + fib[i-2]) % 1000000007;
        
        // HEAVY computation every 10 steps
        if (i % 10 == 0) {
            double dummy = 0;
            for (int j = 0; j < 5000000; j++) {
                dummy += sqrt(j * 1.5) + sin(j * 0.1) + cos(j * 0.2);
            }
        }
    }
    
    return fib[n];
}

int main() {
    int n;
    cin >> n;
    
    // Allocate additional buffer to reach 2-4 MB total
    vector<int> buffer(500000, 0); // ~2MB
    
    long long result = fibonacci_slow(n);
    cout << result << endl;
    
    return 0;
}

/*
Test Cases (GUARANTEED 1-5 seconds):
1. Input: 100
   Expected: Some number (mod 1000000007)
   Time: ~2-3 seconds
   Memory: ~3-4 MB
   
2. Input: 200
   Expected: Some number (mod 1000000007)
   Time: ~4-5 seconds
   Memory: ~3-4 MB

3. Input: 50
   Expected: Some number (mod 1000000007)
   Time: ~1-2 seconds
   Memory: ~2-3 MB

Metrics MUST display in ALL cases:
- Accepted: Show time + memory
- Wrong Answer: Show time + memory + diff
- Runtime Error: Show time + memory + error
- Time Limit: Show time + memory
*/

    for (int i = n - 4; i <= n; i++) {
        cout << "fib(" << i << ") = " << fib_sequence[i] << endl;
    }
    
    return 0;
}
