export interface ModQueue {
  id: string;
  refPath: string;
  payload: any;
  state: 'pending' | 'assigned' | 'completed';
  assignedTo?: string;
  createdAt: string;
}
