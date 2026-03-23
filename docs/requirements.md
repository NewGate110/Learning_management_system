# System Overview
The system is an enhanced Moodle-style Learning Management System (LMS) developed to improve usability, performance, and overall user experience. It includes core LMS functionalities such as user authentication, course management, assignment handling, and grading, while also introducing additional features to better support academic workflows.

The system follows a client–server architecture, where the backend is built using ASP.NET Core and handles business logic, data processing, and API endpoints. The frontend is developed using Angular and interacts with these APIs to provide a responsive and interactive user interface. PostgreSQL is used as the database to manage and store system data.

To extend the capabilities of a traditional LMS, the system introduces a modular structure where courses are divided into modules. It also includes attendance tracking, role-based dashboards for Students, Instructors, and Admin users, timetable management, and a notification system. These features improve organisation, monitoring of academic progress, and overall system efficiency.

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

## SDLC Methodology

The project follows an Agile approach, where development is carried out in stages rather than all at once. This allows features to be built, tested, and improved gradually throughout the development process.

This approach works well for the system, as different components such as the backend, frontend, and system design are being developed in parallel. It helps the team stay organised and makes it easier to manage progress across different parts of the project.

GitHub is used for version control, allowing changes to be tracked and combined efficiently. It also supports collaboration between team members. Regular updates and testing help ensure that all components remain consistent as the system develops.
