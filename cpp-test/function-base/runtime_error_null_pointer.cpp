// Test case: Runtime Error - Null pointer dereference
#include <iostream>
using namespace std;

int getValue(int* ptr) {
    return *ptr;  // Will crash if ptr is NULL
}

void processData(int* data) {
    cout << *data << endl;  // Segmentation fault if data is NULL
}
