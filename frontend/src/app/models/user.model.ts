export interface User {
  id:    number;
  name:  string;
  email: string;
  role:  'Student' | 'Instructor' | 'Admin';
}
