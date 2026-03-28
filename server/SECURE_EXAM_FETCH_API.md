# Secure Exam Fetch API for Candidate Attempt

## Overview
This endpoint provides a sanitized version of exam data specifically for candidates attempting an exam. It removes sensitive information like correct answers and test cases.

## Endpoint

**GET** `/api/exams/:id/attempt`

**Role Required:** Candidate only

## Security Features

### Data Sanitization
The following fields are **removed** from the response:
- ✅ `correctAnswer` (MCQ questions)
- ✅ `testCases` (Coding questions)
- ✅ `createdBy` (Admin information)
- ✅ Internal MongoDB fields (`__v`, etc.)

### Validations
1. ✅ Exam must exist
2. ✅ Exam must have started (current time >= startTime)
3. ✅ Exam must not have ended (current time <= endTime)
4. ✅ Only candidates can access this endpoint

## Request

### Headers
```
Authorization: Bearer <candidate_token>
```

### URL Parameters
- `id` - Exam ID (MongoDB ObjectId)

### Example
```bash
curl -X GET http://localhost:5000/api/exams/65f1234567890abcdef12345/attempt \
  -H "Authorization: Bearer CANDIDATE_TOKEN"
```

## Response

### Success (200)

```json
{
  "exam": {
    "_id": "65f1234567890abcdef12345",
    "title": "JavaScript Fundamentals Test",
    "description": "Test your JavaScript knowledge",
    "startTime": "2026-03-01T09:00:00.000Z",
    "endTime": "2026-03-01T12:00:00.000Z",
    "duration": 120,
    "sections": [
      {
        "title": "Multiple Choice Questions",
        "questions": [
          {
            "type": "mcq",
            "question": "What is the output of: console.log(typeof null)?",
            "options": ["null", "undefined", "object", "number"],
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
            "marks": 20
          }
        ]
      }
    ]
  },
  "remainingTime": 145
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `exam._id` | string | Exam unique identifier |
| `exam.title` | string | Exam title |
| `exam.description` | string | Exam description |
| `exam.startTime` | Date | When exam starts |
| `exam.endTime` | Date | When exam ends |
| `exam.duration` | number | Exam duration in minutes |
| `exam.sections` | array | Array of exam sections |
| `remainingTime` | number | Minutes remaining until exam ends |

### Question Fields (MCQ)

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Always "mcq" |
| `question` | string | Question text |
| `options` | string[] | Array of answer options |
| `marks` | number | Points for this question |

**Note:** `correctAnswer` is **NOT** included for security

### Question Fields (Coding)

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Always "coding" |
| `question` | string | Question text |
| `starterCode` | string | Initial code template |
| `marks` | number | Points for this question |

**Note:** `testCases` are **NOT** included for security

## Error Responses

### 400 - Invalid Exam ID
```json
{
  "message": "Invalid exam ID"
}
```

### 400 - Exam Not Found
```json
{
  "message": "Exam not found"
}
```

### 400 - Exam Not Started
```json
{
  "message": "Exam has not started yet"
}
```

### 400 - Exam Ended
```json
{
  "message": "Exam has already ended"
}
```

### 401 - Unauthorized
```json
{
  "message": "Authorization header missing or invalid"
}
```

### 403 - Forbidden (Not a Candidate)
```json
{
  "message": "Forbidden"
}
```

## Usage Flow

### 1. Candidate Logs In
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "candidate@test.com",
    "password": "candidate123"
  }'
```

Save the token from response.

### 2. View Available Exams
```bash
curl -X GET http://localhost:5000/api/exams \
  -H "Authorization: Bearer CANDIDATE_TOKEN"
```

### 3. Fetch Secure Exam for Attempt
```bash
curl -X GET http://localhost:5000/api/exams/EXAM_ID/attempt \
  -H "Authorization: Bearer CANDIDATE_TOKEN"
```

### 4. Start Exam Submission
```bash
curl -X POST http://localhost:5000/api/submissions/start/EXAM_ID \
  -H "Authorization: Bearer CANDIDATE_TOKEN"
```

### 5. Submit Answers
```bash
curl -X POST http://localhost:5000/api/submissions/submit/SUBMISSION_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CANDIDATE_TOKEN" \
  -d '{
    "answers": [
      {
        "questionId": "0-0",
        "selectedOption": "object"
      }
    ]
  }'
```

## Comparison: Regular vs Secure Fetch

### Regular Fetch (GET /api/exams/:id)
**Available to:** Admin and Candidate
**Includes:**
- ✅ All exam data
- ✅ Correct answers (MCQ)
- ✅ Test cases (Coding)
- ✅ Creator information
- ⚠️ **Not suitable for exam attempts**

### Secure Fetch (GET /api/exams/:id/attempt)
**Available to:** Candidate only
**Includes:**
- ✅ Exam structure
- ✅ Questions
- ✅ Options (MCQ)
- ✅ Starter code (Coding)
- ✅ Remaining time
- ❌ Correct answers (removed)
- ❌ Test cases (removed)
- ❌ Creator info (removed)
- ✅ **Safe for exam attempts**

## Security Considerations

### Why Remove Correct Answers?
Prevents candidates from viewing answers in browser DevTools or network inspector.

### Why Remove Test Cases?
Prevents candidates from reverse-engineering expected outputs for coding questions.

### Why Calculate Remaining Time?
Helps frontend display countdown timer without exposing endTime manipulation.

### Why Validate Timing?
Prevents candidates from accessing exam content before it starts or after it ends.

## Implementation Details

### Service Layer
```typescript
export async function getExamForAttempt(examId: string): Promise<SecureExamResponse> {
  // 1. Validate exam ID
  // 2. Fetch exam from database
  // 3. Check timing constraints
  // 4. Calculate remaining time
  // 5. Sanitize data (remove sensitive fields)
  // 6. Return secure response
}
```

### Controller Layer
```typescript
export async function getExamForAttemptHandler(req, res, next) {
  // 1. Extract exam ID from params
  // 2. Call service function
  // 3. Handle known errors (400)
  // 4. Return JSON response
}
```

### Route Layer
```typescript
router.get(
  '/:id/attempt',
  authenticate,           // Verify JWT token
  requireRole('candidate'), // Ensure user is candidate
  getExamForAttemptHandler  // Handle request
);
```

## Testing

### Test 1: Successful Fetch
```bash
# Should return sanitized exam data
curl -X GET http://localhost:5000/api/exams/EXAM_ID/attempt \
  -H "Authorization: Bearer CANDIDATE_TOKEN"
```

**Expected:** 200 with exam data (no correct answers)

### Test 2: Exam Not Started
```bash
# Create exam with future startTime, then try to fetch
curl -X GET http://localhost:5000/api/exams/FUTURE_EXAM_ID/attempt \
  -H "Authorization: Bearer CANDIDATE_TOKEN"
```

**Expected:** 400 - "Exam has not started yet"

### Test 3: Exam Ended
```bash
# Create exam with past endTime, then try to fetch
curl -X GET http://localhost:5000/api/exams/PAST_EXAM_ID/attempt \
  -H "Authorization: Bearer CANDIDATE_TOKEN"
```

**Expected:** 400 - "Exam has already ended"

### Test 4: Admin Tries to Access
```bash
# Admin should be blocked
curl -X GET http://localhost:5000/api/exams/EXAM_ID/attempt \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected:** 403 - "Forbidden"

### Test 5: Invalid Exam ID
```bash
curl -X GET http://localhost:5000/api/exams/invalid-id/attempt \
  -H "Authorization: Bearer CANDIDATE_TOKEN"
```

**Expected:** 400 - "Invalid exam ID"

## Best Practices

### Frontend Integration
1. Fetch exam using this endpoint when candidate clicks "Start Exam"
2. Display countdown timer using `remainingTime`
3. Store questions locally for offline resilience
4. Never expose correct answers in frontend code
5. Validate answers client-side for UX, but trust server-side scoring

### Backend Security
1. Always validate exam timing server-side
2. Never trust client-provided answers
3. Calculate scores server-side only
4. Log all exam access attempts
5. Rate limit this endpoint to prevent abuse

## Future Enhancements

- [ ] Add exam access logging
- [ ] Implement rate limiting per candidate
- [ ] Add exam preview mode (without timing validation)
- [ ] Support for exam retakes with different question sets
- [ ] Add watermarking to prevent screenshot sharing
