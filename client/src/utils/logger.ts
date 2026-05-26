export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO';
  message: string;
  details?: string;
}

const STORAGE_KEY = 'complainsy_client_logs';

export const logger = {
  addLog(type: 'SUCCESS' | 'ERROR' | 'INFO', message: string, details?: any) {
    try {
      const logs = this.getLogs();
      
      let detailsStr = '';
      if (details) {
        if (typeof details === 'object') {
          try {
            detailsStr = JSON.stringify(details, Object.getOwnPropertyNames(details), 2);
          } catch (e) {
            detailsStr = String(details);
          }
        } else {
          detailsStr = String(details);
        }
      }

      const newEntry: LogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        details: detailsStr || undefined
      };

      // Limit to last 100 logs to prevent storage bloating
      const updatedLogs = [newEntry, ...logs].slice(0, 100);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));

      // Trigger custom event so real-time log viewers can update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('complainsy_log_added', { detail: newEntry }));
      }

      console.log(`[${type}] ${message}`, details || '');
    } catch (err) {
      console.error('Logger failed to write', err);
    }
  },

  getLogs(): LogEntry[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  clearLogs() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('complainsy_log_added'));
    } catch (e) {
      console.error('Failed to clear logs', e);
    }
  }
};
