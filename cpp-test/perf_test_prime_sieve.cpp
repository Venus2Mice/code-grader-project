// Performance Test: Prime Number Counting with Heavy Computation
// Expected time: 1-5 seconds (depending on N)
// Expected memory: 3-5 MB
// Purpose: Test accurate metrics display in all scenarios

#include <iostream>
#include <vector>
#include <cmath>
using namespace std;

// Count primes with VERY heavy computation
int countPrimes(int n) {
    if (n < 2) return 0;
    
    // Allocate sieve array (~3-5 MB for large N)
    vector<bool> isPrime(n + 1, true);
    isPrime[0] = isPrime[1] = false;
    
    // Sieve of Eratosthenes with HEAVY computation
    for (int i = 2; i <= sqrt(n); i++) {
        if (isPrime[i]) {
            for (int j = i * i; j <= n; j += i) {
                isPrime[j] = false;
            }
            
            // VERY heavy computation every 5 iterations
            if (i % 5 == 0) {
                double dummy = 0;
                for (int k = 0; k < 10000000; k++) {
                    dummy += sqrt(k * 1.2) + cos(k * 0.05) + sin(k * 0.1);
                }
            }
        }
    }
    
    // Count primes
    int count = 0;
    for (int i = 2; i <= n; i++) {
        if (isPrime[i]) count++;
    }
    
    return count;
}

int main() {
    int n;
    cin >> n;
    
    // Allocate extra buffer to increase memory usage
    vector<int> buffer(400000, 0); // ~1.6 MB additional
    
    int result = countPrimes(n);
    cout << result << endl;
    
    return 0;
}

/*
Test Cases (GUARANTEED 1-5 seconds):
1. Input: 50000
   Expected: 5133 (number of primes up to 50K)
   Time: ~2-3 seconds
   Memory: ~3-4 MB

2. Input: 100000
   Expected: 9592 (number of primes up to 100K)
   Time: ~4-5 seconds
   Memory: ~4-5 MB

3. Input: 25000
   Expected: 2762 (number of primes up to 25K)
   Time: ~1-2 seconds
   Memory: ~2-3 MB

Metrics Display Test:
- ACCEPTED: Input=50000, Output=5133 → Must show time (2-3s) + memory (3-4MB)
- WRONG ANSWER: Input=50000, Output=123 → Must show time + memory + received/expected
- RUNTIME ERROR: Modify code to crash → Must show time + memory + error type
- TIME LIMIT: Set limit to 1s, input=100000 → Must show time + memory + "TLE"

This ensures metrics are ALWAYS visible regardless of verdict!
*/

    long long sum_of_primes = 0;
    for (int prime : primes) {
        sum_of_primes += prime;
    }
    cout << "Sum of all primes: " << sum_of_primes << endl;
    
    // Additional computation: count twin primes (primes p where p+2 is also prime)
    int twin_prime_count = 0;
    for (size_t i = 0; i + 1 < primes.size(); i++) {
        if (primes[i + 1] - primes[i] == 2) {
            twin_prime_count++;
        }
    }
    cout << "Twin prime pairs found: " << twin_prime_count << endl;
    
    // Show statistics
    cout << "\nFirst 10 primes: ";
    for (int i = 0; i < 10 && i < (int)primes.size(); i++) {
        cout << primes[i] << " ";
    }
    cout << endl;
    
    cout << "Last 10 primes: ";
    for (size_t i = max(0, (int)primes.size() - 10); i < primes.size(); i++) {
        cout << primes[i] << " ";
    }
    cout << endl;
    
    return 0;
}
