# Interview Management System Documentation

## Implementation Status

### Completed Backend Components:

1. Models (`src/models/interview.py`)

   - Interview model with all necessary fields
   - InterviewFeedback model for storing evaluations
   - Enums for status, types, and modes

2. Service Layer (`src/services/interview_service.py`)

   - Complete CRUD operations for interviews
   - Interview feedback management
   - Schedule management features
   - Status updates (cancel, reschedule)

3. API Routes (`src/routers/interview.py`)
   - All REST endpoints implemented
   - Input validation
   - Error handling
   - Response models

### Required Backend Implementation (For Fayzan):

1. Database Setup:

   ```python
   # Add to your database models
   from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, Float
   from sqlalchemy.orm import relationship
   from datetime import datetime
   import enum

   # Copy the Interview and InterviewFeedback models from src/models/interview.py
   # Add relationships to existing Candidate, Job, and User models:

   class Candidate(Base):
       # Add relationship
       interviews = relationship("Interview", back_populates="candidate")

   class Job(Base):
       # Add relationship
       interviews = relationship("Interview", back_populates="job")

   class User(Base):
       # Add relationship
       conducted_interviews = relationship("Interview", back_populates="interviewer")
   ```

2. Database Migration:

   - Create a new migration for interview tables
   - Add foreign key relationships
   - Set up indexes for performance

3. Integration Points:
   - Connect interview system with existing candidate management
   - Link with job management system
   - Integrate with user authentication

### API Endpoints to Implement

1. Interview Management:

   ```python
   # Routes to implement in FastAPI

   @router.post("/api/interviews")
   async def create_interview(...)

   @router.get("/api/interviews/{interview_id}")
   async def get_interview(...)

   @router.get("/api/interviews")
   async def list_interviews(...)

   @router.put("/api/interviews/{interview_id}")
   async def update_interview(...)

   @router.delete("/api/interviews/{interview_id}")
   async def delete_interview(...)
   ```

2. Feedback Management:

   ```python
   @router.post("/api/interviews/{interview_id}/feedback")
   async def create_feedback(...)

   @router.get("/api/interviews/{interview_id}/feedback")
   async def get_feedback(...)

   @router.put("/api/interviews/feedback/{feedback_id}")
   async def update_feedback(...)

   @router.delete("/api/interviews/feedback/{feedback_id}")
   async def delete_feedback(...)
   ```

3. Schedule Management:

   ```python
   @router.get("/api/interviews/upcoming/next-days")
   async def get_upcoming_interviews(...)

   @router.get("/api/interviews/interviewer/{interviewer_id}/schedule")
   async def get_interviewer_schedule(...)

   @router.post("/api/interviews/{interview_id}/cancel")
   async def cancel_interview(...)

   @router.post("/api/interviews/{interview_id}/reschedule")
   async def reschedule_interview(...)
   ```

### Frontend Requirements

Once the backend is implemented, these frontend components will need to be created:

1. Interview List View (`/interviews`)

   - Table/grid display of all interviews
   - Filtering and sorting
   - Quick actions

2. Interview Creation Form (`/interviews/create`)

   - Form with all necessary fields
   - Validation
   - Candidate/Job/Interviewer selection

3. Interview Detail View (`/interviews/:id`)

   - Full interview information
   - Feedback management
   - Status updates

4. Calendar View (optional)
   - Visual calendar of interviews
   - Drag-and-drop scheduling

### Testing Requirements

1. Unit Tests:

   - Test all service methods
   - Test API endpoints
   - Test model validations

2. Integration Tests:
   - Test database operations
   - Test API workflows
   - Test relationships between models

### Next Steps for Fayzan:

1. Review the provided models and endpoints
2. Set up database migrations for the new tables
3. Implement the service layer and API endpoints
4. Add necessary tests
5. Integrate with existing authentication system
6. Test all endpoints with Postman/Swagger
7. Document any changes or additions to the API

### Notes:

- All models and interfaces are TypeScript-ready
- API follows REST best practices
- Built with scalability in mind
- Includes comprehensive error handling
- Supports future feature additions
