export interface Event {
  eventId: string;
  createdAt: string;
  userId: string;
  // data fields
  name?: string;
  email?: string;
  amount?: number;
  transaction?: number;
}
