export interface Plan {
  type?: 'call' | 'chat';
  name?: string;
  duration?: string;
  minutes?: number;
  messages?: number;
  price: number;
}
