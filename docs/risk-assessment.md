# Risk Assessment

This section outlines some of the possible risks that could affect the development and overall performance of the LMS system. The risks include technical issues, security concerns, and problems that may occur during teamwork and development. Mitigation strategies are included to reduce the chances of these risks affecting the final system.

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Team members may accidentally work on the same feature or file at the same time, which can create confusion or duplicate work. | Medium | High | Use GitHub branches properly and communicate regularly before making major changes. |
| Merge conflicts may happen when combining work from different team members into the same branch. | Medium | Medium | Keep commits organised, commit changes regularly, and review pull requests before merging. |
| Some frontend pages may not work correctly if the backend APIs or data models do not match properly. | Medium | High | Test frontend and backend integration frequently and keep models consistent across both sides. |
| Database migration or configuration issues could affect stored course, attendance, or grading data. | Medium | High | Test migrations carefully before applying them and avoid unnecessary manual database changes. |
| Authentication or permission errors could allow users to access features that are not meant for their role. | Low | High | Use JWT authentication, Angular route guards, and backend authorization checks for protected routes. |
| Email reminders or notification features may stop working because of SMTP or environment configuration problems. | Medium | Medium | Test email settings separately and keep in-app notifications stored in the database as backup alerts. |
| Attendance calculation errors may incorrectly block students from submitting assignments. | Medium | High | Test the attendance logic with different attendance percentages before deployment. |
| The project may fall behind schedule because of the amount of required features, diagrams, and documentation. | Medium | High | Divide tasks clearly between group members and prioritise the core LMS features first. |
| Sensitive user information such as passwords, grades, or attendance records could be exposed if security is not handled properly. | Low | High | Store passwords securely, use role-based access control, and avoid uploading `.env` files or secrets to GitHub. |
| Docker or environment setup issues may prevent the system from running properly during testing or the final demonstration. | Medium | High | Test the Docker setup regularly and keep setup instructions updated in the project README. |
