# /grader-engine/run_worker.py
from worker.main import main

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('Worker interrupted by user.')