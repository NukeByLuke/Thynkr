# Thynkr: AI-Powered Learning Management System
## Project Proposal

---

## Project Charter

### Problem Statement [5/5]

**What process/system needs improvement:**
Traditional learning management systems require students to manually create study materials from their course content. Students often struggle to convert lecture notes, PDFs, and textbooks into effective study tools like flashcards, practice questions, and summaries. This manual process is time-consuming and often results in inconsistent study materials that don't leverage modern AI capabilities for personalized learning.

**Who is affected by this problem:**
- Post-secondary students who need to efficiently study large volumes of course material
- Lifelong learners and professionals pursuing certifications or skill development
- Educators who want to provide supplementary study materials to their students
- Study groups seeking collaborative learning tools

**What is the impact of not solving it:**
Students waste 3-5 hours per week manually creating study materials instead of actual studying. This leads to poor time management, inconsistent study habits, reduced retention rates, and increased academic stress. Many students resort to ineffective cramming sessions before exams because they lack proper study materials throughout the term.

---

### Objectives [5/5]

**What specific goals does building this achieve:**
- Reduce study material preparation time by 80% through AI automation
- Increase student engagement with course content through interactive study tools
- Provide personalized learning experiences that adapt to individual student needs
- Create a centralized platform for organizing courses, files, and study progress
- Enable intelligent tutoring through AI-powered chat assistance

**How will success be measured:**
- User registration and retention rates (target: 70% monthly active users)
- Time saved per student per week (target: 3+ hours)
- Number of study sessions completed (target: 4+ per user per week)
- AI-generated content quality ratings from users (target: 4/5 stars)
- Study material generation success rate (target: 95% successful conversions)

**What is the expected benefit:**
Students achieve better academic outcomes through consistent, high-quality study materials. The platform reduces cognitive load by automating material creation, allowing students to focus on learning rather than preparation. Long-term benefits include improved retention rates, higher grades, and development of effective study habits that persist beyond individual courses.

---

### Scope Boundaries [5/5]

**What features are included:**
- User authentication and authorization (registration, login, password reset)
- Course management (create, edit, delete courses with metadata and images)
- File upload and storage system for course materials (PDFs, documents)
- AI-powered flashcard generation from uploaded content
- AI-powered practice question generation with difficulty levels
- AI-powered summary generation for study materials
- Interactive study interface with spaced repetition algorithms
- AI tutor chatbot for course-specific questions and explanations
- Progress tracking and analytics dashboard
- Search and filter functionality across courses and study materials
- Responsive web interface for desktop and mobile devices

**What features are excluded (out of scope):**
- Live video streaming or video conferencing
- Direct integration with university LMS systems (Canvas, Blackboard, Moodle)
- Payment processing or subscription management (free platform for MVP)
- Social networking features (friend requests, messaging between users)
- Mobile native applications (iOS/Android apps)
- Content marketplace or user-generated course sharing
- Calendar integration or scheduling tools
- Grading or assignment submission features

**What other systems does this need to interact with:**
- OpenAI API (GPT-4) for AI content generation and tutoring
- Cloud storage service (AWS S3 or DigitalOcean Spaces) for file storage
- PostgreSQL database for structured data storage
- Email service provider (SendGrid, AWS SES) for transactional emails
- Docker container orchestration for deployment
- Nginx reverse proxy for web traffic management

---

### Stakeholders [5/5]

**Development Team:**
- Luke (Full-stack Developer) - Lead developer responsible for architecture, backend API, frontend implementation, and deployment

**Primary Users:**
- Post-secondary students (18-30 years old) - Main target audience for the platform
- Adult learners and professionals - Secondary audience for certification study

**Advisory/Approval Stakeholders:**
- Course instructor - Provides requirements and evaluates project milestones
- Beta test users (5-10 students) - Provide feedback on usability and features
- Academic advisor - Ensures project meets educational objectives

**Indirect Stakeholders:**
- OpenAI - API service provider for AI functionality
- DigitalOcean - Infrastructure hosting provider

---

### Timeline [5/5]

**November 2025:**
- Project proposal and charter completion
- Requirements gathering and user stories finalized
- Database schema design and architecture planning
- Technology stack selection confirmed (React, Fastify, PostgreSQL)

**December 2025:**
- Core authentication system implementation (registration, login, JWT)
- Database setup with PostgreSQL and Prisma ORM
- Basic course management CRUD operations
- File upload system with validation
- Deployment pipeline established with Docker

**January 2026:**
- AI integration with OpenAI API for flashcard generation
- AI-powered practice question generation
- AI-powered summary generation
- Study interface with interactive flashcard review
- Progress tracking foundation

**February 2026:**
- AI tutor chatbot implementation
- Advanced study features (spaced repetition, difficulty adjustment)
- User analytics dashboard
- Search and filter functionality
- UI/UX refinements and responsive design improvements

**March 2026:**
- Beta testing with student users
- Bug fixes and performance optimization
- Security hardening and penetration testing
- Final documentation and deployment
- Project presentation and demonstration

**April 2026:**
- Post-launch monitoring and maintenance
- User feedback collection and analysis
- Future enhancement planning

---

### Initial Budget Estimate [5/5]

**Hourly Rate:** $50/hour (junior developer rate)

**Development Hours Breakdown:**
- Planning and design: 40 hours
- Backend API development: 80 hours
- Frontend development: 100 hours
- AI integration and prompt engineering: 60 hours
- Database design and implementation: 30 hours
- Testing and quality assurance: 50 hours
- Deployment and DevOps: 30 hours
- Documentation: 20 hours
- Bug fixes and refinements: 40 hours

**Total Development Hours:** 450 hours
**Labor Cost:** 450 × $50 = **$22,500**

**Infrastructure Costs (6 months):**
- DigitalOcean VPS (4GB RAM): $24/month × 6 = $144
- Domain registration (thynkr.ca): $15/year
- SSL certificate: $0 (Let's Encrypt - free)
- Object storage: $5/month × 6 = $30
- Database hosting: Included in VPS
- OpenAI API usage: $200 (estimated based on usage)

**Total Infrastructure:** $389

**Total Project Budget:** $22,500 + $389 = **$22,889**

**Note:** This is a solo academic project, so actual monetary costs are limited to infrastructure ($389). Labor is not paid but valued at market rates for budgeting exercise purposes.

---

## Requirements

### Feature List with Priorities [5/5]

**Priority 1 (Must Have - Core MVP):**
1. **User Authentication System** - Registration, login, logout, JWT token management, password hashing
2. **Course Management** - Create, read, update, delete courses with titles, descriptions, and metadata
3. **File Upload System** - Upload PDFs and documents to courses, file validation, storage management
4. **AI Flashcard Generation** - Parse uploaded files and generate study flashcards using GPT-4
5. **Interactive Study Interface** - Display flashcards with flip animation, track progress through deck

**Priority 2 (Should Have - Enhanced Learning):**
6. **AI Practice Questions** - Generate multiple-choice and short-answer questions from content
7. **AI Summary Generation** - Create concise summaries of uploaded materials
8. **AI Tutor Chatbot** - Context-aware conversational assistant for course questions
9. **Progress Tracking** - Track study sessions, completion rates, and performance metrics
10. **Search and Filter** - Find courses, lessons, and study materials quickly

**Priority 3 (Nice to Have - User Experience):**
11. **Spaced Repetition Algorithm** - Intelligent scheduling of flashcard reviews based on performance
12. **Difficulty Adjustment** - Adaptive learning that adjusts question difficulty
13. **Analytics Dashboard** - Visualizations of study habits, progress trends, and time spent
14. **Course Images/Branding** - Custom banner and cover images for courses
15. **Export Study Materials** - Download flashcards and questions as PDFs

**What tasks must users accomplish:**
- Create an account and log in securely
- Organize their academic life by creating courses
- Upload course materials (lecture notes, textbooks, PDFs)
- Generate study materials automatically from uploaded content
- Study using flashcards with an intuitive interface
- Practice with AI-generated questions
- Get help from an AI tutor when confused
- Track their study progress over time
- Search and filter through their courses and materials

**What data needs to be stored:**
- User profiles (username, email, hashed password, preferences)
- Course information (title, description, banner/cover images, creation date)
- Lesson/file metadata (filename, file path, upload date, size, type)
- AI-generated content (flashcards with question/answer pairs, practice questions, summaries)
- Study session data (completion times, scores, review intervals)
- Chat history with AI tutor (for context and user reference)
- Analytics data (session counts, time spent, performance metrics)

**What reports are needed:**
- Study progress reports showing completion rates by course
- Performance analytics showing quiz scores and improvement trends
- Time management reports showing study time distribution across courses
- Flashcard mastery reports showing which cards need more review
- Course overview reports showing total lessons, generated materials, and usage stats

---

### User Stories/Use Cases [5/5]

**Primary User Persona: Sarah, 2nd Year University Student**
- Age: 20
- Studies: Business Administration
- Tech-savvy, manages 5 courses per semester
- Struggles with time management and effective studying
- Uses laptop and smartphone daily

**User Story 1: Getting Started**
- **As** a new user
- **I want to** create an account and add my courses
- **So that** I can organize my study materials in one place
- **Acceptance Criteria:** Can register with email/password, log in successfully, create multiple courses with titles and descriptions

**User Story 2: Uploading Course Materials**
- **As** a student
- **I want to** upload my lecture PDFs to a course
- **So that** the system can generate study materials for me
- **Acceptance Criteria:** Can upload PDF files up to 10MB, see confirmation of successful upload, view uploaded files in course

**User Story 3: Generating Flashcards**
- **As** a student
- **I want to** automatically generate flashcards from my uploaded notes
- **So that** I can save time and focus on studying instead of manual card creation
- **Acceptance Criteria:** Click a button to generate flashcards, receive 10-20 quality cards per document, cards have clear questions and answers

**User Story 4: Studying with Flashcards**
- **As** a student preparing for an exam
- **I want to** review flashcards in an interactive interface
- **So that** I can test my knowledge and reinforce learning
- **Acceptance Criteria:** Cards flip to reveal answers, can mark cards as correct/incorrect, progress is tracked, can navigate through deck

**User Story 5: Getting Help**
- **As** a student who is confused about a topic
- **I want to** ask an AI tutor questions about my course material
- **So that** I can get immediate explanations and clarifications
- **Acceptance Criteria:** Can type questions in chat interface, receive relevant answers based on course content, conversation is contextual

**User Story 6: Practice Testing**
- **As** a student
- **I want to** take practice quizzes generated from my materials
- **So that** I can assess my understanding before the real exam
- **Acceptance Criteria:** System generates multiple-choice questions, can submit answers and see results, questions vary in difficulty

**User Story 7: Tracking Progress**
- **As** a motivated student
- **I want to** see my study statistics and progress
- **So that** I can stay motivated and identify areas needing more focus
- **Acceptance Criteria:** Dashboard shows courses studied, time spent, completion rates, performance trends over time

**User Story 8: Managing Courses**
- **As** a student
- **I want to** edit course details and delete old courses
- **So that** I can keep my workspace organized and up-to-date
- **Acceptance Criteria:** Can edit course names/descriptions, delete courses with confirmation, changes persist after logout

**Secondary User Persona: Mark, Professional Certification Candidate**
- Age: 35
- Goal: Pass PMP certification exam
- Limited study time (busy work schedule)
- Needs efficient, focused study tools

**User Story 9: Efficient Material Processing**
- **As** a working professional
- **I want to** quickly upload multiple study guides and get summaries
- **So that** I can review key concepts without reading hundreds of pages
- **Acceptance Criteria:** Can upload multiple files at once, receive concise summaries highlighting key points, summaries are accurate

**User Story 10: Mobile Studying**
- **As** a busy professional
- **I want to** study on my phone during commute
- **So that** I can make productive use of spare moments throughout the day
- **Acceptance Criteria:** Interface is responsive and works on mobile browsers, flashcards are easy to flip on touchscreen, progress syncs across devices

---

### Technical Constraints [5/5]

**Platform Support:**
- **Primary Platform:** Web application (browser-based)
- **Supported Browsers:** Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Device Support:** Desktop (Windows, macOS, Linux), Tablet, Mobile (responsive design)
- **Minimum Screen Resolution:** 375px width (iPhone SE) to 4K displays
- **No native mobile apps:** Mobile access via responsive web design only

**Technology Stack:**
- **Frontend:** React 18 with TypeScript, Vite build tool, TailwindCSS for styling
- **Backend:** Node.js with Fastify framework, TypeScript
- **Database:** PostgreSQL 15+ for relational data storage
- **ORM:** Prisma for type-safe database queries
- **AI Integration:** OpenAI API (GPT-4 model) for content generation
- **Authentication:** JWT (JSON Web Tokens) with bcrypt password hashing
- **File Storage:** Local file system or object storage (DigitalOcean Spaces)
- **Deployment:** Docker containers on DigitalOcean VPS, Nginx reverse proxy

**Performance Constraints:**
- API response time: < 2 seconds for standard operations
- AI generation time: < 30 seconds for flashcard/question generation
- File upload size limit: 10MB per file
- Concurrent users: Support for 100+ simultaneous users
- Database connections: Connection pooling with max 20 connections

**Browser Requirements:**
- JavaScript must be enabled
- Cookies and localStorage must be enabled for authentication
- Modern CSS Grid and Flexbox support required
- WebSocket support for real-time chat features (future)

**Network Requirements:**
- Minimum bandwidth: 1 Mbps for smooth operation
- HTTPS required for all production traffic
- CORS configured for API access from frontend domain

**Development Environment:**
- Git version control (GitHub)
- VS Code as primary IDE
- Docker for containerization and local development
- pnpm for package management

---

### Security Requirements [5/5]

**Authentication and Authorization:**
- **Password Security:** All passwords hashed using bcrypt (12 salt rounds minimum)
- **Token Management:** JWT tokens with 24-hour expiration, HTTP-only cookies for web
- **Session Management:** Secure token storage, automatic logout on expiration
- **Authorization Levels:** Role-based access control (admin vs standard user)
- **Multi-factor Authentication:** Not in MVP, planned for future enhancement

**Data Protection:**
- **Encryption in Transit:** HTTPS/TLS 1.3 for all network communication
- **Encryption at Rest:** Database-level encryption for sensitive fields (future enhancement)
- **API Security:** Rate limiting (100 requests per minute per user), request validation
- **File Upload Security:** File type validation, virus scanning (planned), size limits
- **SQL Injection Prevention:** Parameterized queries through Prisma ORM
- **XSS Prevention:** Input sanitization, Content Security Policy headers
- **CSRF Protection:** CSRF tokens for state-changing operations

**Privacy and Compliance:**
- **Data Minimization:** Only collect necessary user information
- **User Data Control:** Users can delete their accounts and all associated data
- **Data Retention:** User data retained until account deletion
- **Privacy Policy:** Clear disclosure of data collection and usage
- **Cookie Consent:** Transparent cookie usage disclosure
- **GDPR Considerations:** Right to access, right to deletion, data portability (for future EU users)

**Infrastructure Security:**
- **Server Hardening:** Firewall configuration, SSH key authentication, disabled root login
- **Dependency Management:** Regular security updates, automated vulnerability scanning
- **Environment Variables:** Sensitive config stored in environment variables, not in code
- **API Key Security:** OpenAI API keys stored securely, never exposed to frontend
- **Backup Strategy:** Daily automated database backups with 30-day retention
- **Monitoring and Logging:** Security event logging, error tracking, intrusion detection

**Incident Response:**
- **Error Handling:** Graceful error messages without exposing system details
- **Audit Logging:** Track authentication attempts, data modifications, admin actions
- **Security Updates:** Rapid deployment process for critical security patches
- **Vulnerability Reporting:** Clear process for security researchers to report issues

**Third-Party Security:**
- **OpenAI API:** Secure API key management, rate limiting, usage monitoring
- **File Storage:** Access controls on storage buckets, signed URLs for file access
- **Docker Security:** Non-root containers, minimal base images, security scanning

---

### Data Requirements [5/5]

**Data Classification:**

**1. Public Data (Low Sensitivity):**
- Course titles and descriptions
- Publicly visible user profiles (if feature added)
- System documentation and help content
- **Security:** Standard HTTPS encryption, no special handling required

**2. Internal Data (Medium Sensitivity):**
- AI-generated flashcards and questions
- Course materials uploaded by users
- Study progress and analytics
- Chat history with AI tutor
- **Security:** Access restricted to authenticated users, encrypted in transit, user-specific access control

**3. Personal Identifiable Information (High Sensitivity):**
- User email addresses
- User account credentials
- IP addresses (logs)
- **Security:** Encrypted in transit (HTTPS), hashed passwords (bcrypt), minimal collection, secure storage with access controls

**4. Authentication Data (Critical Sensitivity):**
- Passwords (stored as bcrypt hashes only)
- JWT tokens and session data
- Password reset tokens
- **Security:** Never stored in plain text, bcrypt hashing (12+ rounds), secure token generation, short expiration times, HTTP-only cookies

**Data Storage Strategy:**

**PostgreSQL Database:**
- **User Data:** id, username, email, password_hash, created_at, updated_at
- **Course Data:** id, user_id, title, description, banner_image, cover_image, created_at
- **Lesson Data:** id, course_id, title, file_path, file_size, file_type, uploaded_at
- **Flashcard Data:** id, lesson_id, question, answer, difficulty, created_at
- **Study Session Data:** id, user_id, lesson_id, started_at, completed_at, score
- **Chat History:** id, user_id, course_id, message, role (user/assistant), timestamp

**File System Storage:**
- User-uploaded PDFs and documents stored with unique identifiers
- File naming: `uploads/<user_id>/<course_id>/<uuid>_<original_filename>`
- Access control: Files accessible only to owning user
- Backup: Included in nightly backup routine

**Data Retention and Deletion:**
- **Active User Data:** Retained indefinitely while account is active
- **Deleted Accounts:** 30-day grace period, then permanent deletion
- **Study Analytics:** Retained for lifetime of account for progress tracking
- **Logs:** Security logs retained 90 days, error logs 30 days
- **Backups:** 30-day rolling backup retention

**Data Backup and Recovery:**
- **Database Backups:** Automated daily full backups at 2 AM
- **File Backups:** Weekly backups of user-uploaded files
- **Backup Location:** Offsite storage (separate from production server)
- **Recovery Testing:** Monthly backup restoration tests
- **Recovery Time Objective (RTO):** 4 hours
- **Recovery Point Objective (RPO):** 24 hours

**Data Access and Auditing:**
- **User Access:** Users can only access their own data (enforced at API level)
- **Admin Access:** Minimal admin privileges, logged and monitored
- **API Access Logs:** All data access logged with user ID, timestamp, action
- **Audit Trail:** Track creation, modification, deletion of sensitive records
- **Data Export:** Users can request full data export in JSON format

**Data Integrity:**
- **Database Constraints:** Foreign keys, unique constraints, NOT NULL requirements
- **Transaction Management:** ACID compliance for critical operations
- **Validation:** Input validation at API layer and database layer
- **Data Consistency:** Regular integrity checks via cron jobs

**Data Portability:**
- **Export Format:** JSON for structured data, ZIP archive for files
- **Import Capability:** Not in MVP, planned for future
- **Migration Tools:** SQL scripts for schema changes, version controlled

**GDPR and Privacy Compliance (Proactive):**
- **Right to Access:** Users can view all their data via settings page
- **Right to Deletion:** Account deletion removes all personal data
- **Right to Rectification:** Users can edit profile information
- **Data Minimization:** Only collect email and password (minimal PII)
- **Purpose Limitation:** Data used only for providing study platform services
- **Consent:** Terms of service acceptance required at registration

**Data Security Monitoring:**
- **Intrusion Detection:** Monitor for unusual data access patterns
- **Anomaly Detection:** Alert on bulk data exports or suspicious queries
- **Performance Monitoring:** Track database performance and query times
- **Capacity Planning:** Monitor storage usage and scale proactively

---

## Summary

Thynkr is a comprehensive AI-powered learning management system designed to revolutionize how students interact with their course materials. By automating the creation of study tools through advanced AI integration, the platform addresses the time-consuming challenge of manual study material preparation while providing personalized learning experiences.

The project scope encompasses 10+ core features including authentication, course management, file uploads, AI-generated flashcards, practice questions, intelligent tutoring, and progress analytics. Built with a modern tech stack (React, Fastify, PostgreSQL, OpenAI API) and deployed via Docker containers, Thynkr will support 100+ concurrent users with robust security measures and data protection.

Over a 6-month development timeline from November 2025 to April 2026, this solo academic project will deliver a production-ready web application with an estimated budget of $22,889 (including valued labor) and actual infrastructure costs of under $400. The platform prioritizes user privacy, data security, and an intuitive user experience while maintaining technical excellence through modern development practices.

Success will be measured by user engagement metrics, time saved on study preparation, and the quality of AI-generated content, with the ultimate goal of improving student academic outcomes through intelligent, automated study assistance.
