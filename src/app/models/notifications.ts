export interface Notifications {
  id?: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  refId?: string;
}
