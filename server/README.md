# Online Recruitment Examination System - Backend

A complete backend API for conducting online recruitment examinations with role-based access control, automatic MCQ grading, and comprehensive submission tracking.

## Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Candidate)
- Secure password hashing with bcrypt
- Token-based session management

### Exam Management
- Create exams with multiple sections
- Support for MCQ and coding questions
- Time-bound exam scheduling
- Test cases for coding questions
- Full CRUD operations (Admin only)

### Exam Submission
- Start exam with validation
- Real-time answer submission
- Automatic MCQ scoring
- Duplicate submission prevention
- Submission history tracking

### Security
- Helmet.js for HTTP headers
- CORS configuration
- Rate limiting
- Input validation
- Error sanitization

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, bcrypt, express-rate-limit
- **Logging**: Morgan

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── env.ts                 # Environment configuration
│   ├── controllers/
│   │   ├── auth.controller.ts     # Authentication handlers
│   │   ├── exam.controller.ts     # Exam management handlers
│   │   └── submission.controller.ts # Submission handlers
│   ├── middlewares/
│   │   ├── auth.middleware.ts     # JWT authentication
│   │   ├── error.middleware.ts    # Error handling
│   │   └── role.middleware.ts     # Role-based access
│   ├── models/
│   │   ├── User.ts                # User schema
│   │   ├── Exam.ts                # Exam schema
│   │   └── Submission.ts          # Submission schema
│   ├── routes/
│   │   ├── auth.routes.ts         # Auth endpoints
│   │   ├── exam.routes.ts         # Exam endpoints
│   │   └── submission.routes.ts   # Submission endpoints
│   ├── services/
│   │   ├── auth.service.ts        # Auth business logic
│   │   ├── exam.service.ts        # Exam business logic
│   │   └── submission.service.ts  # Submission business logic
│   ├── utils/
│   │   ├── jwt.ts                 # JWT utilities
│   │   ├── logger.ts              # Logging utilities
│   │   └── password.ts            # Password hashing
│   ├── app.ts                     # Express app setup
│   └── server.ts                  # Server entry point
├── .env                           # Environment variables
├── .env.example                   # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
```bash
cd server
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/online_recruit_system
JWT_SECRET=your-super-secret-jwt-key-change-this
CORS_ORIGIN=*
```

4. **Start MongoDB**
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas cloud connection
```

5. **Run the server**
```bash
# Development mode with auto-reload
npm run dev

# Production build
npm run build
npm start
```

## API Documentation

### Quick Reference
See [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md) for endpoint overview.

### Detailed Documentation
- [EXAM_API_EXAMPLES.md](./EXAM_API_EXAMPLES.md) - Exam management API
- [SUBMISSION_API_EXAMPLES.md](./SUBMISSION_API_EXAMPLES.md) - Submission API
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Complete testing guide

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Exams (Admin)
- `POST /api/exams` - Create exam
- `GET /api/exams` - List all exams
- `GET /api/exams/:id` - Get exam details
- `PUT /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam

### Submissions (Candidate)
- `POST /api/submissions/start/:examId` - Start exam
- `POST /api/submissions/submit/:submissionId` - Submit answers
- `GET /api/submissions/my` - Get my submissions
- `GET /api/submissions/:id` - Get submission details

### Admin
- `GET /api/submissions/all` - View all submissions

### Health
- `GET /api/health` - Server health check

## Usage Examples

### 1. Register Admin
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

### 2. Create Exam
```bash
curl -X POST http://localhost:5000/api/exams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "JavaScript Test",
    "description": "Basic JavaScript knowledge test",
    "startTime": "2026-03-01T00:00:00Z",
    "endTime": "2026-12-31T23:59:59Z",
    "duration": 60,
    "sections": [
      {
        "title": "MCQ Section",
        "questions": [
          {
            "type": "mcq",
            "question": "What is JavaScript?",
            "options": ["Language", "Framework", "Library", "Database"],
            "correctAnswer": "Language",
            "marks": 10
          }
        ]
      }
    ]
  }'
```

### 3. Start Exam (Candidate)
```bash
curl -X POST http://localhost:5000/api/submissions/start/EXAM_ID \
  -H "Authorization: Bearer CANDIDATE_TOKEN"
```

### 4. Submit Exam
```bash
curl -X POST http://localhost:5000/api/submissions/submit/SUBMISSION_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CANDIDATE_TOKEN" \
  -d '{
    "answers": [
      {
        "questionId": "0-0",
        "selectedOption": "Language"
      }
    ]
  }'
```

## Testing

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing instructions.

### Quick Test
```bash
# Health check
curl http://localhost:5000/api/health

# Expected response
{
  "status": "ok",
  "service": "online-recruit-system-backend",
  "database": "connected"
}
```

## Development

### Scripts
```bash
npm run dev      # Start development server with auto-reload
npm run build    # Build TypeScript to JavaScript
npm start        # Start production server
npm run lint     # Run linter (if configured)
npm run kill-port # Kill process on port 5000
```

### Code Style
- Follow existing patterns (Controller → Service → Model)
- Use TypeScript for type safety
- Implement proper error handling
- Add validation for all inputs
- Write clear, descriptive variable names

## Troubleshooting

### Port Already in Use
The server automatically finds the next available port. If you need to manually free port 5000:

**Windows:**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -ti:5000 | xargs kill -9
```

Or use the npm script:
```bash
npm run kill-port
```

### MongoDB Connection Issues
1. Ensure MongoDB is running
2. Check MONGODB_URI in .env
3. Verify network connectivity
4. Check MongoDB logs

### TypeScript Compilation Errors
```bash
# Clean build
rm -rf dist
npm run build
```

## Security Considerations

### Production Deployment
1. Change JWT_SECRET to a strong random string
2. Set NODE_ENV=production
3. Configure proper CORS_ORIGIN
4. Use HTTPS
5. Enable rate limiting
6. Set up monitoring and logging
7. Use environment variables for secrets
8. Regular security updates

### Best Practices
- Never commit .env file
- Use strong passwords
- Implement rate limiting
- Validate all inputs
- Sanitize error messages
- Use HTTPS in production
- Regular dependency updates

## Architecture

### Clean Architecture Pattern
```
Request → Middleware → Controller → Service → Model → Database
                                        ↓
                                    Response
```

### Key Principles
- Separation of concerns
- Single responsibility
- Dependency injection
- Type safety with TypeScript
- Error handling at all layers

## Performance

### Optimizations
- Database indexes on frequently queried fields
- Connection pooling
- Efficient query patterns
- Minimal data transfer
- Caching strategies (future)

### Scalability
- Stateless API design
- Horizontal scaling ready
- Load balancer compatible
- Microservices ready

## Future Enhancements

### Planned Features
- [ ] Auto-evaluation for coding questions
- [ ] Code execution sandbox
- [ ] Time limit enforcement
- [ ] Partial answer saving
- [ ] Email notifications
- [ ] Analytics dashboard
- [ ] Export to PDF/CSV
- [ ] Proctoring features
- [ ] Video recording
- [ ] Plagiarism detection

## Contributing

1. Follow existing code patterns
2. Write TypeScript with proper types
3. Add error handling
4. Update documentation
5. Test thoroughly

## License

MIT

## Support

For issues and questions:
- Check [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- Review [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- Check API documentation files

## Changelog

### v1.0.0 (Current)
- ✅ User authentication and authorization
- ✅ Exam management (CRUD)
- ✅ Exam submission system
- ✅ Automatic MCQ grading
- ✅ Role-based access control
- ✅ Comprehensive API documentation
- ✅ Production-ready error handling
- ✅ Automatic port fallback
- ✅ MongoDB integration
- ✅ TypeScript support
