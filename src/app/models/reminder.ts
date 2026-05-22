export interface Reminder {
  id?: string;
  userId: string;
  title: string;
  eventDate: string;
  remindDaysBefore: number;
  createdAt: string;
}
