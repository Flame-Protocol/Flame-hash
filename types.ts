
export interface FileResult {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  hash: string;
  timestamp: number;
  aiAnalysis?: string;
}

export enum HashStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
