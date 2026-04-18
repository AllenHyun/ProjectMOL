export interface User {
  uid: string;
  role: 'visitor' | 'reader' | 'moderator' | 'admin';
  interests: string[];
  username: string;
  email: string;
  level: 'ESO' | 'Uni' | 'Posgrado';
  photoUrl: string;
  createdAt: string;
  bio?: string;
}
