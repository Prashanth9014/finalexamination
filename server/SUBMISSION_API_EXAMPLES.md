# Exam Submission API Examples

## Authentication
All submission endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### 1. Start Exam (Candidate Only)
**POST** `/api/submissions/start/:examId`

Starts an exam attempt for the authenticated candidate. Creates a new submission record.

**Validations:**
- Exam must exist
- Exam must be currently active (between startTime and endTime)
- Candidate cannot start if already submitted
- Returns existing in-progress submission if found

**Request:**
```bash
POST /api/submissions/start/65f1234567890abcdef12345
Authorization: Bearer CANDIDATE_TOKEN
```

**Response (200):**
```json
{
  "message": "Exam started successfully",
  "submission": {
    "_id": "65f9876543210fedcba09876",
    "userId": "65f0987654321fedcba09876",
    "examId": "65f1234567890abcdef12345",
    "answers": [],
    "score": 0,
    "startedAt": "2026-03-03T10:00:00.000Z",
    "status": "in-progress",
    "createdAt": "2026-03-03T10:00:00.000Z",
    "updatedAt": "2026-03-03T10:00:00.000Z"
  },
  "exam": {
    "_id": "65f1234567890abcdef12345",
    "title": "Full Stack Developer Assessment",
    "description": "Comprehensive exam covering frontend, backend, and database concepts",
    "startTime": "2026-03-03T09:00:00.000Z",
    "endTime": "2026-03-03T12:00:00.000Z",
    "duration": 120,
    "sections": [...]
  }
}
```

**Error Responses:**

400 - Exam not started yet:
```json
{
  "message": "Exam has not started yet"
}
```

400 - Exam already ended:
```json
{
  "message": "Exam has already ended"
}
```

400 - Already submitted:
```json
{
  "message": "You have already submitted this exam"
}
```

---

### 2. Submit Exam (Candidate Only)
**POST** `/api/submissions/submit/:submissionId`

Submits answers for an exam. Automatically calculates score for MCQ questions.

**Question ID Format:**
- Use `sectionIndex-questionIndex` format
- Example: `"0-0"` for first question in first section
- Example: `"1-2"` for third question in second section

**Request Body:**
```json
{
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
}
```

**Response (200):**
```json
{
  "message": "Exam submitted successfully",
  "submission": {
    "_id": "65f9876543210fedcba09876",
    "userId": "65f0987654321fedcba09876",
    "examId": "65f1234567890abcdef12345",
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
    ],
    "score": 10,
    "startedAt": "2026-03-03T10:00:00.000Z",
    "submittedAt": "2026-03-03T11:30:00.000Z",
    "status": "submitted",
    "createdAt": "2026-03-03T10:00:00.000Z",
    "updatedAt": "2026-03-03T11:30:00.000Z"
  }
}
```

**Error Responses:**

400 - Already submitted:
```json
{
  "message": "Submission already completed"
}
```

403 - Not your submission:
```json
{
  "message": "Unauthorized: This is not your submission"
}
```

---

### 3. Get My Submissions (Candidate Only)
**GET** `/api/submissions/my`

Retrieves all submissions for the authenticated candidate.

**Response (200):**
```json
[
  {
    "_id": "65f9876543210fedcba09876",
    "userId": "65f0987654321fedcba09876",
    "examId": {
      "_id": "65f1234567890abcdef12345",
      "title": "Full Stack Developer Assessment",
      "description": "Comprehensive exam covering frontend, backend, and database concepts",
      "startTime": "2026-03-03T09:00:00.000Z",
      "endTime": "2026-03-03T12:00:00.000Z",
      "duration": 120
    },
    "answers": [...],
    "score": 10,
    "startedAt": "2026-03-03T10:00:00.000Z",
    "submittedAt": "2026-03-03T11:30:00.000Z",
    "status": "submitted",
    "createdAt": "2026-03-03T10:00:00.000Z",
    "updatedAt": "2026-03-03T11:30:00.000Z"
  }
]
```

---

### 4. Get All Submissions (Admin Only)
**GET** `/api/submissions/all`

Retrieves all submissions from all candidates (admin only).

**Response (200):**
```json
[
  {
    "_id": "65f9876543210fedcba09876",
    "userId": {
      "_id": "65f0987654321fedcba09876",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "candidate"
    },
    "examId": {
      "_id": "65f1234567890abcdef12345",
      "title": "Full Stack Developer Assessment",
      "description": "Comprehensive exam"
    },
    "answers": [...],
    "score": 10,
    "startedAt": "2026-03-03T10:00:00.000Z",
    "submittedAt": "2026-03-03T11:30:00.000Z",
    "status": "submitted",
    "createdAt": "2026-03-03T10:00:00.000Z",
    "updatedAt": "2026-03-03T11:30:00.000Z"
  }
]
```

---

### 5. Get Submission by ID (Admin or Owner)
**GET** `/api/submissions/:id`

Retrieves a specific submission. Admin can view any submission, candidates can only view their own.

**Response (200):**
```json
{
  "_id": "65f9876543210fedcba09876",
  "userId": {
    "_id": "65f0987654321fedcba09876",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "examId": {
    "_id": "65f1234567890abcdef12345",
    "title": "Full Stack Developer Assessment",
    "description": "Comprehensive exam",
    "startTime": "2026-03-03T09:00:00.000Z",
    "endTime": "2026-03-03T12:00:00.000Z",
    "duration": 120
  },
  "answers": [...],
  "score": 10,
  "startedAt": "2026-03-03T10:00:00.000Z",
  "submittedAt": "2026-03-03T11:30:00.000Z",
  "status": "submitted",
  "createdAt": "2026-03-03T10:00:00.000Z",
  "updatedAt": "2026-03-03T11:30:00.000Z"
}
```

**Error Responses:**

403 - Not authorized:
```json
{
  "message": "Unauthorized: You can only view your own submissions"
}
```

404 - Not found:
```json
{
  "message": "Submission not found"
}
```

---

## Complete Workflow Example

### Step 1: Candidate Starts Exam
```bash
curl -X POST http://localhost:5000/api/submissions/start/EXAM_ID \
  -H "Authorization: Bearer CANDIDATE_TOKEN"
```

### Step 2: Candidate Answers Questions
(Frontend stores answers locally as candidate progresses)

### Step 3: Candidate Submits Exam
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
        "codingAnswer": "function sum(a, b) { return a + b; }"
      }
    ]
  }'
```

### Step 4: Candidate Views Their Submissions
```bash
curl -X GET http://localhost:5000/api/submissions/my \
  -H "Authorization: Bearer CANDIDATE_TOKEN"
```

### Step 5: Admin Views All Submissions
```bash
curl -X GET http://localhost:5000/api/submissions/all \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Scoring Logic

### MCQ Questions (Auto-Calculated)
- Correct answer: Full marks
- Wrong answer: 0 marks
- No answer: 0 marks

### Coding Questions (Manual Evaluation Required)
- Score is NOT auto-calculated
- Requires manual review or future auto-evaluation system
- Test cases are stored but not executed yet

---

## Business Rules

1. **Exam Timing:**
   - Can only start exam between startTime and endTime
   - Duration is informational (not enforced server-side yet)

2. **Duplicate Prevention:**
   - Cannot start exam if already submitted
   - Returns existing in-progress submission if found

3. **Ownership:**
   - Candidates can only submit their own submissions
   - Candidates can only view their own submissions
   - Admins can view all submissions

4. **Status Flow:**
   - `in-progress` → `submitted` (one-way, cannot revert)

---

## Future Enhancements

- [ ] Auto-evaluation for coding questions using test cases
- [ ] Time limit enforcement (auto-submit after duration)
- [ ] Partial save (save answers before final submission)
- [ ] Plagiarism detection for coding answers
- [ ] Detailed analytics and reports
- [ ] Export submissions to CSV/PDF
