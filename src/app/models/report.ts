export interface Report {
  id: string;
  reporterId: string;
  type: 'summary' | 'review';
  refPath: string;
  reason: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
}
