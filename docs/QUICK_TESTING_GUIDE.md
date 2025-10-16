# Quick Testing Guide

## Prerequisites

1. **Database migrations applied:**
   ```bash
   cd backend
   flask db upgrade
   ```

2. **Backend running:**
   ```bash
   cd backend
   python run.py
   # Should be running on http://localhost:5000
   ```

3. **Frontend running:**
   ```bash
   cd frontend-new
   npm run dev
   # Should be running on http://localhost:3000
   ```

4. **Environment variables set:**
   - Frontend: `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:5000`

---

## 🧪 Test Scenarios

### Scenario 1: Teacher Complete Flow

1. **Register Teacher Account**
   - Go to `/register`
   - Fill in: Name, Email, Password
   - Select "Teacher" role
   - Submit → Should auto-login and redirect to `/teacher/dashboard`

2. **Create Class**
   - Click "Create Class" button
   - Enter: Class name, Course code, Description
   - Submit → Should see new class in list

3. **Create Problem**
   - Click on the class card
   - Click "Create Assignment"
   - Fill in:
     - Title: "Two Sum"
     - Description: "Given array and target, find two numbers that sum to target"
     - Difficulty: "Medium"
     - Time Limit: 1000ms
     - Memory Limit: 256MB
     - Grading Mode: "Standard I/O" or "Function-based"
     - Add test cases with input/output
   - Submit → Should redirect back to class detail

4. **View Problem Details**
   - From class detail, click "View" on the problem
   - Should see all submissions (empty initially)
   - Check "Problem Details" tab

### Scenario 2: Student Complete Flow

1. **Register Student Account**
   - Go to `/register`
   - Fill in: Name, Email, Password
   - Select "Student" role
   - Submit → Should auto-login and redirect to `/student/dashboard`

2. **Join Class**
   - Click "Join Class" button
   - Enter the course code from teacher's class
   - Submit → Should see class appear in list

3. **View Class Problems**
   - Click on the class card
   - Should see all problems with "Not Started" status

4. **Solve Problem**
   - Click on a problem
   - Write code in the editor
   - Select language (C++, Python, Java, C)
   - Click "Submit"
   - Should see submission queued message

5. **View Submission History**
   - Click "History" button
   - Should see list of your submissions
   - Click to view previous submission code

### Scenario 3: Cross-User Interaction

1. **Teacher creates problem** (as tested above)
2. **Student joins class** (as tested above)
3. **Student submits solution** (as tested above)
4. **Teacher views submission:**
   - Go to `/teacher/problem/[id]`
   - Should see student's submission in list
   - Click "View Code" to see the submitted code

---

## ✅ Expected Behaviors

### Authentication
- [x] Register creates new user in database
- [x] Login returns JWT token
- [x] Token stored in localStorage
- [x] Profile fetched after login
- [x] Role-based redirect (teacher → `/teacher/dashboard`, student → `/student/dashboard`)
- [x] Logout clears token and redirects to login

### Teacher Dashboard
- [x] Displays all teacher's classes
- [x] Shows course_code, description, student count, created date
- [x] Create class adds to database and refreshes list
- [x] Click class navigates to detail page

### Student Dashboard
- [x] Displays enrolled classes
- [x] Join class with invite code works
- [x] Shows class info and problem counts
- [x] Click class navigates to detail page

### Class Detail Pages
- [x] Teacher sees: Assignments, Students, Settings tabs
- [x] Student sees: List of problems with status
- [x] Problem status reflects submissions (accepted/pending/failed)
- [x] Student count and list accurate

### Problem Creation
- [x] All fields saved correctly
- [x] Test cases created with problem
- [x] Points allocation per test case
- [x] Hidden test cases marked correctly
- [x] Function signature saved for function mode

### Problem Solving
- [x] Problem details displayed correctly
- [x] Code editor works
- [x] Language selection changes editor mode
- [x] Submit sends code to backend
- [x] Submission history loads correctly
- [x] Can view previous submission code

---

## 🐛 Debugging Tips

### Issue: "Failed to fetch" errors
**Solution:** Check that backend is running on port 5000

### Issue: 401 Unauthorized
**Solution:** Token expired or invalid. Logout and login again.

### Issue: CORS errors
**Solution:** Backend should have CORS enabled for localhost:3000

### Issue: Page shows "Not found"
**Solution:** Check URL and ensure ID exists in database

### Issue: Empty arrays returned
**Solution:** 
- Check database has data
- Verify user has permission to access resource
- Check API endpoint in Network tab

### Issue: Backend returns 500 error
**Solution:** Check backend console for error details

---

## 📊 API Endpoints to Test

### Auth
- `POST /api/auth/register` - Create user
- `POST /api/auth/login` - Get JWT token
- `GET /api/auth/profile` - Get user info

### Classes
- `GET /api/classes` - List classes
- `POST /api/classes` - Create class
- `GET /api/classes/{id}` - Get class details
- `GET /api/classes/{id}/students` - List students
- `POST /api/classes/join` - Join class

### Problems
- `POST /api/classes/{id}/problems` - Create problem
- `GET /api/problems/{id}` - Get problem details
- `GET /api/problems/{id}/submissions` - Get submissions

### Submissions
- `POST /api/submissions` - Submit code
- `GET /api/submissions/me` - My submissions
- `GET /api/submissions/{id}/code` - Get submission code

### Students
- `GET /api/students/me/classes/{id}/problems-status` - Problem status

---

## 🔍 Database Verification

After testing, verify data in database:

```bash
# Connect to PostgreSQL
psql -d code_grader

# Check tables
\dt

# Verify users created
SELECT id, email, full_name FROM "user";

# Verify classes created
SELECT id, name, course_code FROM class;

# Verify problems created
SELECT id, title, class_id FROM problem;

# Verify test cases
SELECT id, problem_id, points, is_hidden FROM test_case;

# Verify submissions
SELECT id, user_id, problem_id, status, score FROM submission;
```

---

## 📝 Testing Checklist

- [ ] Register teacher account
- [ ] Register student account
- [ ] Login with both accounts
- [ ] Teacher creates class
- [ ] Student joins class
- [ ] Teacher creates problem with test cases
- [ ] Student views problem
- [ ] Student submits solution
- [ ] Teacher views submission
- [ ] Check database for all records
- [ ] Test logout and re-login
- [ ] Test error handling (wrong password, duplicate email)
- [ ] Test empty states (no classes, no problems)
- [ ] Test loading states (refresh pages)

---

## 🚀 Next: Production Deployment

Once all tests pass:
1. Set up production database
2. Configure production environment variables
3. Build frontend: `npm run build`
4. Deploy backend with gunicorn
5. Set up HTTPS
6. Configure domain names
7. Set up monitoring

---

**Happy Testing!** 🎉
