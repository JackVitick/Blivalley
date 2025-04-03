import { useState, useEffect } from 'react';
import { Clock, CheckCircle, X, AlertCircle } from 'lucide-react';

interface WorkSessionProps {
  projectId: string;
  milestoneId: string;
  taskId: string;
  onSessionEnd: () => void;
}

interface Session {
  _id: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed';
  note: string;
}

export default function WorkSession({ projectId, milestoneId, taskId, onSessionEnd }: WorkSessionProps) {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Fetch active session on component mount
  useEffect(() => {
    fetchActiveSession();
  }, [projectId, milestoneId, taskId]);

  // Update elapsed time for active sessions
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (activeSession && activeSession.status === 'active') {
      const startTime = new Date(activeSession.startTime).getTime();
      
      interval = setInterval(() => {
        const now = new Date().getTime();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession]);

  // Format elapsed time as HH:MM:SS
  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch active session
  const fetchActiveSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/sessions?projectId=${projectId}&active=true`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch active session');
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        setActiveSession(data[0]);
        
        // Calculate initial elapsed time
        const startTime = new Date(data[0].startTime).getTime();
        const now = new Date().getTime();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
      } else {
        setActiveSession(null);
      }
    } catch (err) {
      console.error('Error fetching active session:', err);
      setError('Failed to load active session');
    } finally {
      setIsLoading(false);
    }
  };

  // Start a new work session
  const startSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          milestoneId,
          taskId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start session');
      }
      
      const newSession = await response.json();
      setActiveSession(newSession);
      setElapsedTime(0);
    } catch (err) {
      console.error('Error starting session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start session');
    } finally {
      setIsLoading(false);
    }
  };

  // End the current session
  const endSession = async () => {
    if (!activeSession) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/sessions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: activeSession._id,
          note,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to end session');
      }
      
      setActiveSession(null);
      setNote('');
      onSessionEnd();
    } catch (err) {
      console.error('Error ending session:', err);
      setError('Failed to end session');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (activeSession) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="font-medium text-blue-800">Active Work Session</h3>
          </div>
          <div className="text-lg font-mono font-bold text-blue-800">
            {formatElapsedTime(elapsedTime)}
          </div>
        </div>
        
        <div className="mb-3">
          <label htmlFor="session-note" className="block text-sm font-medium text-gray-700 mb-1">
            Session Notes
          </label>
          <textarea
            id="session-note"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="What did you accomplish in this session?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={endSession}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            End Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="font-medium text-gray-700">No Active Session</h3>
        </div>
        <button
          onClick={startSession}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Start Session
        </button>
      </div>
    </div>
  );
} 