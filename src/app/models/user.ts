export interface User {
  uid: string;
  role: 'reader' | 'moderator' | 'admin';
  interests: string[];
  username: string;
  level: string;
  createdAt: string;
}
