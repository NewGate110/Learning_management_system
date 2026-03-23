# System Overview
The system is an enhanced Moodle-style Learning Management System (LMS) developed to improve usability, performance, and overall user experience. It includes core LMS functionalities such as user authentication, course management, assignment handling, and grading, while also introducing additional features to better support academic workflows.

The system is built using ASP.NET Core for the backend, Angular for the frontend, and PostgreSQL as the database. The backend is responsible for handling data processing and exposing API endpoints, while the frontend interacts with these APIs to provide a responsive and interactive interface.

To extend the capabilities of a traditional LMS, the system introduces a modular structure where courses are divided into modules. It also includes attendance tracking, role-based dashboards for Students, Instructors, and Admin users, timetable management, and a notification system. These features aim to improve organisation, monitoring, and overall user experience.

---

# Functional Requirements
The system supports the following functionalities:

- Users can register and log in with role-based access (Student, Instructor, Admin)
- Students can view their enrolled courses and track module-based progress
- Courses are structured into modules (Sequential, Compulsory, Optional)
- Students can submit assignments within modules
- Instructors can grade assignments and assessments
- Attendance is tracked per module, and assignment submission is restricted if attendance falls below 80%
- Students can view grades for assignments and assessments separately
- Final module grades are released only after all items are graded
- The system provides a timetable with scheduled sessions, including support for cancellations and rescheduling
- A calendar displays relevant events such as deadlines, assessments, and timetable sessions
- Users receive notifications for deadlines, grading updates, and timetable changes
- The frontend communicates with backend APIs for all operations
- Access to system features is controlled through authentication and role-based permissions

---

# Non-Functional Requirements
The system is designed to meet the following quality requirements:

- The system provides efficient performance when handling user requests and data
- User data is securely managed using authentication and authorization mechanisms
- The interface is designed to be user-friendly and easy to navigate
- The system remains reliable during normal usage conditions
- The architecture supports scalability for future enhancements
- The system structure supports maintainability and team collaboration
- Proper error handling is implemented to manage system failures effectively

---

# SDLC Methodology
Agile methodology is used for the development of this system. It allows the team to work in iterative stages, making it easier to develop, test, and refine features throughout the project.

This approach supports parallel development of different system components, including backend services, frontend features, and system design. GitHub is used for version control, enabling efficient collaboration and tracking of changes. Continuous integration ensures that all components remain aligned with the overall system design.
