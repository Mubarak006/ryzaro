
export type TaskType = 'Math' | 'Shake' | 'QR' | 'Memory' | 'Sequence';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface CompletionRecord {
  date: string; // ISO string
  task: TaskType;
  label: string;
}

export interface Alarm {
  id: string;
  time: string; // HH:mm format
  period: 'AM' | 'PM';
  label: string;
  days: number[]; // 0 = Mon, 6 = Sun
  date?: string; // YYYY-MM-DD for specific date alarms
  active: boolean;
  task: TaskType;
  difficulty: Difficulty;
  sound: string;
}

export interface UserStats {
  currentStreak: number;
  bestStreak: number;
  totalWakes: number;
  lastWakeDate?: string; // ISO string
  history: CompletionRecord[]; // Detailed records of completed tasks
}

export type AppView = 
  | 'SPLASH' 
  | 'CAUTION' 
  | 'HOME' 
  | 'ADD_ALARM' 
  | 'SELECT_TASK' 
  | 'RINGING' 
  | 'COMPLETED' 
  | 'STATS' 
  | 'SETTINGS'
  | 'CHAT'
  | 'CALENDAR';
