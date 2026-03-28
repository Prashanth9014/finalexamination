# Complete Testing Guide

## Prerequisites

1. Server running: `npm run dev`
2. MongoDB connected
3. Two user accounts:
   - Admin account (for creating exams)
   - Candidate account (for taking exams)

---

## Step-by-Step Testing

### 1. Register Users

**Register Admin:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@test.com",
    "password": "admin123",
    "role": "admin"
  }'
```

**Register Candidate:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Candidate",
    "email": "candidate@test.com",
    "password": "candidate123",
    "role": "candidate"
  }'
```

Save the tokens from responses:
- `ADMIN_TOKEN`
- `CANDIDATE_TOKEN`

---

### 2. Create Exam (Admin)

```bash
curl -X POST http://localhost:5000/api/exams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "title": "JavaScript Fundamentals Test",
    "description": "Test your JavaScript knowledge",
    "startTime": "2026-03-01T00:00:00Z",
    "endTime": "2026-12-31T23:59:59Z",
    "duration": 60,
    "sections": [
      {
        "title": "Multiple Choice Questions",
        "questions": [
          {
            "type": "mcq",
            "question": "What is the output of: console.log(typeof null)?",
            "options": ["null", "undefined", "object", "number"],
            "correctAnswer": "object",
            "marks": 5
          },
          {
            "type": "mcq",
            "question": "Which method adds elements to the end of an array?",
            "options": ["push()", "pop()", "shift()", "unshift()"],
            "correctAnswer": "push()",
            "marks": 5
          }
        ]
      },
      {
        "title": "Coding Challenge",
        "questions": [
          {
            "type": "coding",
            "question": "Write a function that returns the sum of two numbers",
            "starterCode": "function sum(a, b) {\n  // Your code here\n}",
            "testCases": [
              {
                "input": "sum(2, 3)",
                "expectedOutput": "5"
              },
              {
                "input": "sum(-1, 1)",
                "expectedOutput": "0"
              }
            ],
            "marks": 20
          }
        ]
      }
    ]
  }'
```

Save the exam `_id` from response as `EXAM_ID`.

---

### 3. View All Exams (Any Authenticated User)

```bash
curl -X GET http://localhost:5000/api/exams \
  -H "Authorization: Bearer CANDIDATE_TOKEN"
```

---

### 4. Start Exam (Candidate)

```bash
curl -X POST http://localhost:5000/api/submissions/start/EXAM_ID \
  -H "Authorization: Bearer CANDIDATE_TOKEN"
```

Save the submission `_id` from response as `SUBMISSION_ID`.

**Expected Response:**
```json
{
  "message": "Exam started successfully",
  "submission": {
    "_id": "SUBMISSION_ID",
    "status": "in-progress",
    ...
  },
  "exam": {...}
}
```

---

### 5. Submit Exam (Candidate)

```bash
curl -X POST http://localhost:5000/api/submissions/submit/SUBMISSION_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CANDIDATE_TOKEN" \
  -d '{
    "answers": [
      {
        "questionId": "0-0",
        "selectedOption": "object"
      },
      {
        "questionId": "0-1",
        "selectedOption": "push()"
      },
      {
        "questionId": "1-0",
        "codingAnswer": "function sum(a, b) {\n  return a + b;\n}"
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "message": "Exam submitted successfully",
  "submission": {
    "score": 10,
    "status": "submitted",
    "submittedAt": "2026-03-03T11:30:00.000Z",
    ...
  }
}
```

**Score Calculation:**
- Question 0-0: Correct (object) → 5 marks
- Question 0-1: Correct (push()) → 5 marks
- Question 1-0: Coding (not auto-graded) → 0 marks
- **Total: 10 marks**

---

### 6. View My Submissions (Candidate)

```bash
curl -X GET http://localhost:5000/api/submissions/my \
  -H "Authorization: Bearer CANDIDATE_TOKEN"
```

---

### 7. View All Submissions (Admin)

```bash
curl -X GET http://localhost:5000/api/submissions/all \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### 8. View Specific Submission

**As Candidate (own submission):**
```bash
curl -X GET http://localhost:5000/api/submissions/SUBMISSION_ID \
  -H "Authorization: Bearer CANDIDATE_TOKEN"
```

**As Admin (any submission):**
```bash
curl -X GET http://localhost:5000/api/submissions/SUBMISSION_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Error Testing

### Test 1: Start Exam That Already Submitted
```bash
# Try to start the same exam again
curl -X POST http://localhost:5000/api/submissions/start/EXAM_ID \
  -H "Authorization: Bearer CANDIDATE_TOKEN"
```

**Expected:** `400 - "You have already submitted this exam"`

---

### Test 2: Submit Already Submitted Exam
```bash
# Try to submit again
curl -X POST http://localhost:5000/api/submissions/submit/SUBMISSION_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CANDIDATE_TOKEN" \
  -d '{"answers": []}'
```

**Expected:** `400 - "Submission already completed"`

---

### Test 3: Candidate Tries to Create Exam
```bash
curl -X POST http://localhost:5000/api/exams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CANDIDATE_TOKEN" \
  -d '{...}'
```

**Expected:** `403 - "Forbidden"`

---

### Test 4: Admin Tries to Start Exam
```bash
curl -X POST http://localhost:5000/api/submissions/start/EXAM_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected:** `403 - "Forbidden"`

---

### Test 5: View Another User's Submission (Candidate)
```bash
# Candidate tries to view another candidate's submission
curl -X GET http://localhost:5000/api/submissions/OTHER_SUBMISSION_ID \
  -H "Authorization: Bearer CANDIDATE_TOKEN"
```

**Expected:** `403 - "Unauthorized: You can only view your own submissions"`

---

## Postman Collection

Import this JSON into Postman for easier testing:

```json
{
  "info": {
    "name": "Online Recruitment System",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000"
    },
    {
      "key": "adminToken",
      "value": ""
    },
    {
      "key": "candidateToken",
      "value": ""
    },
    {
      "key": "examId",
      "value": ""
    },
    {
      "key": "submissionId",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register Admin",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/auth/register",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Admin User\",\n  \"email\": \"admin@test.com\",\n  \"password\": \"admin123\",\n  \"role\": \"admin\"\n}"
            }
          }
        },
        {
          "name": "Register Candidate",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/auth/register",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"John Candidate\",\n  \"email\": \"candidate@test.com\",\n  \"password\": \"candidate123\",\n  \"role\": \"candidate\"\n}"
            }
          }
        }
      ]
    },
    {
      "name": "Exams",
      "item": [
        {
          "name": "Create Exam",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/exams",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{adminToken}}"
              }
            ]
          }
        },
        {
          "name": "Get All Exams",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/exams",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{candidateToken}}"
              }
            ]
          }
        }
      ]
    },
    {
      "name": "Submissions",
      "item": [
        {
          "name": "Start Exam",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/submissions/start/{{examId}}",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{candidateToken}}"
              }
            ]
          }
        },
        {
          "name": "Submit Exam",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/submissions/submit/{{submissionId}}",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{candidateToken}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"answers\": [\n    {\n      \"questionId\": \"0-0\",\n      \"selectedOption\": \"object\"\n    }\n  ]\n}"
            }
          }
        },
        {
          "name": "Get My Submissions",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/submissions/my",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{candidateToken}}"
              }
            ]
          }
        },
        {
          "name": "Get All Submissions (Admin)",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/submissions/all",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{adminToken}}"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

---

## Database Verification

Connect to MongoDB and verify data:

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/online_recruit_system

# View collections
show collections

# View exams
db.exams.find().pretty()

# View submissions
db.submissions.find().pretty()

# View users
db.users.find({}, {password: 0}).pretty()
```

---

## Success Criteria

✅ Admin can create exams with MCQ and coding questions
✅ Candidate can view available exams
✅ Candidate can start an exam (creates submission)
✅ Candidate cannot start exam twice
✅ Candidate can submit answers
✅ MCQ questions are auto-graded correctly
✅ Candidate can view their own submissions
✅ Admin can view all submissions
✅ Proper role-based access control enforced
✅ Clear error messages for invalid operations
