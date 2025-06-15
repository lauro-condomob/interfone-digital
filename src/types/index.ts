// Tipos compartilhados entre componentes

export interface CallData {
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  from: string;
  candidate?: RTCIceCandidateInit;
}

export type LogEntry = { 
  type: 'log' | 'warn' | 'error'; 
  message: string; 
};

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: number;
}

export type CallEndReason = 'ended' | 'rejected' | 'busy' | 'disconnected';

export interface VideoCallProps {
  userId: string;
  onLogout?: () => void;
} 