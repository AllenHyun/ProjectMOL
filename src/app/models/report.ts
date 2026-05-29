export interface Report {
  reporterId: string;
  type: 'summary' | 'review';
  refPath: string;
  reason: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
}
