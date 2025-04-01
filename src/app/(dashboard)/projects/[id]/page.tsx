'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronUp, 
  MoreVertical, 
  Edit2, 
  Calendar,
  Plus,
  X,
  MessageSquare
} from 'lucide-react';

interface Task {
  _id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  notes: string;
  lastSession?: {
    timestamp: string;
    note: string;
  };
}

interface Milestone {
  _id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  tasks: Task[];
}

interface Project {
  _id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'completed' | 'archived';
  progress: number;
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  milestones: Milestone[];
}

interface Session {
  _id: string;
  projectId: string;
  milestoneId: string;
  taskId: string;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  note: string;
}

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [expandedMilestones, setExpandedMilestones] = useState<string[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [activeTask, setActiveTask] = useState<{ milestoneId: string; taskId: string } | null>(null);
  const [noteText, setNoteText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch project and active session on mount
  useEffect(() => {
    fetchProject();
    fetchActiveSession();
  }, [params.id]);

  // Fetch project data
  const fetchProject = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }
      const data = await response.json();
      setProject(data);
      
      // Initialize expanded milestones with all active milestones
      const activeMilestoneIds = data.milestones
        .filter((m: Milestone) => m.status === 'in_progress')
        .map((m: Milestone) => m._id);
      
      if (activeMilestoneIds.length > 0) {
        setExpandedMilestones(activeMilestoneIds);
      } else if (data.milestones.length > 0) {
        // If no active milestones, expand the first one
        setExpandedMilestones([data.milestones[0]._id]);
      }
    } catch (err) {
      setError('Error loading project. Please try again.');
      console.error('Error fetching project:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch active session
  const fetchActiveSession = async () => {
    try {
      const response = await fetch(`/api/sessions?projectId=${params.id}&active=true`);
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      if (data && data.length > 0) {
        setActiveSession(data[0]);
        setActiveTask({
          milestoneId: data[0].milestoneId,
          taskId: data[0].taskId
        });
      }
    } catch (err) {
      console.error('Error fetching active session:', err);
    }
  };

  // Toggle milestone expansion
  const toggleMilestone = (milestoneId: string) => {
    setExpandedMilestones(prevState => {
      if (prevState.includes(milestoneId)) {
        return prevState.filter(id => id !== milestoneId);
      } else {
        return [...prevState, milestoneId];
      }
    });
  };
  
  // Set active task for session
  const setTaskActive = async (milestoneId: string, taskId: string) => {
    // If there's already an active session for this task, just highlight it
    if (activeSession && activeSession.milestoneId === milestoneId && activeSession.taskId === taskId) {
      setActiveTask({ milestoneId, taskId });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // End any existing session first
      if (activeSession) {
        await endSession(activeSession._id);
      }
      
      // Start new session
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: params.id,
          milestoneId,
          taskId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start session');
      }
      
      const data = await response.json();
      setActiveSession(data);
      setActiveTask({ milestoneId, taskId });
      
      // Refresh project to update task statuses
      fetchProject();
    } catch (err) {
      setError('Error starting session. Please try again.');
      console.error('Error starting session:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // End an active session
  const endSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note: noteText,
          taskNote: noteText
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to end session');
      }
      
      setActiveSession(null);
      setNoteText('');
      
      // Refresh project to update task statuses
      fetchProject();
      
      return true;
    } catch (err) {
      console.error('Error ending session:', err);
      return false;
    }
  };
  
  // Update task status
  const updateTaskStatus = async (milestoneId: string, taskId: string, status: 'not_started' | 'in_progress' | 'completed') => {
    try {
      const response = await fetch(`/api/projects/${params.id}/milestones/${milestoneId}/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task status');
      }
      
      // Refresh project
      fetchProject();
    } catch (err) {
      setError('Error updating task status. Please try again.');
      console.error('Error updating task status:', err);
    }
  };
  
  // Save session note
  const saveNote = async () => {
    if (!activeSession || !noteText.trim()) return;
    
    try {
      const response = await fetch(`/api/sessions/${activeSession._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note: noteText,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save note');
      }
      
      // Update active session with the new note
      const updatedSession = await response.json();
      setActiveSession(updatedSession);
      
      // Also update the task's last session info
      if (activeTask) {
        const taskResponse = await fetch(`/api/projects/${params.id}/milestones/${activeTask.milestoneId}/tasks/${activeTask.taskId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'in_progress',
            note: noteText,
          }),
        });
        
        if (!taskResponse.ok) {
          throw new Error('Failed to update task note');
        }
        
        // Refresh project to update UI
        fetchProject();
      }
      
      return true;
    } catch (err) {
      setError('Error saving note. Please try again.');
      console.error('Error saving note:', err);
      return false;
    }
  };
  
  // Get status icon based on status
  const getStatusIcon = (status: 'not_started' | 'in_progress' | 'completed') => {
    switch(status) {
      case 'completed':
        return <CheckCircle2 className="text-green-500 dark:text-green-400 w-5 h-5" />;
      case 'in_progress':
        return <Clock className="text-blue-500 dark:text-blue-400 w-5 h-5" />;
      default:
        return <Circle className="text-gray-300 dark:text-gray-600 w-5 h-5" />;
    }
  };
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Find active task data
  const findActiveTask = () => {
    if (!project || !activeTask) return null;
    
    const milestone = project.milestones.find(m => m._id === activeTask.milestoneId);
    if (!milestone) return null;
    
    const task = milestone.tasks.find(t => t._id === activeTask.taskId);
    if (!task) return null;
    
    return { task, milestone };
  };
  
  // Calculate remaining days until deadline
  const getDaysRemaining = (deadline?: string) => {
    if (!deadline) return null;
    
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg p-4">
        {error}
        <button 
          onClick={() => fetchProject()}
          className="ml-4 text-blue-600 dark:text-blue-400 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Project not found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">The requested project could not be found.</p>
        <Link 
          href="/dashboard"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const activeTaskData = findActiveTask();

  return (
    <div>
      {/* Back to Dashboard */}
      <div className="mb-6">
        <Link 
          href="/dashboard"
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span className="text-sm">Back to Dashboard</span>
        </Link>
      </div>
      
      {/* Project Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{project.name}</h1>
                {project.category && (
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">
                    {project.category}
                  </span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
                {project.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400">
                <Edit2 className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Project Progress */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Progress</h3>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{project.progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    project.progress >= 70 
                      ? 'bg-green-500 dark:bg-green-400' 
                      : 'bg-blue-500 dark:bg-blue-400'
                  }`}
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {project.milestones.filter(m => m.status === 'completed').length} of {project.milestones.length} milestones completed
              </div>
            </div>
            
            {project.deadline && (
              <div>
                <div className="flex items-center mb-1">
                  <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-1" />
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Deadline</h3>
                </div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatDate(project.deadline)}
                </div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {getDaysRemaining(project.deadline)} days remaining
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Milestones */}
      <div className="space-y-4 mb-20">
        {project.milestones.map((milestone) => (
          <div key={milestone._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Milestone Header */}
            <div 
              className={`p-4 flex justify-between items-center cursor-pointer ${
                milestone.status === 'completed' 
                  ? 'bg-green-50 dark:bg-green-900/20' 
                  : milestone.status === 'in_progress' 
                    ? 'bg-blue-50 dark:bg-blue-900/20' 
                    : 'bg-white dark:bg-gray-800'
              }`}
              onClick={() => toggleMilestone(milestone._id)}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(milestone.status)}
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-white">{milestone.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="relative w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`absolute top-0 left-0 h-full rounded-full ${
                          milestone.status === 'completed' 
                            ? 'bg-green-500 dark:bg-green-400' 
                            : milestone.status === 'in_progress' 
                              ? 'bg-blue-500 dark:bg-blue-400' 
                              : 'bg-gray-400 dark:bg-gray-600'
                        }`}
                        style={{ 
                          width: `${
                            milestone.status === 'completed' 
                              ? '100' 
                              : milestone.status === 'in_progress' 
                                ? Math.round((milestone.tasks.filter(t => t.status === 'completed').length / milestone.tasks.length) * 100) 
                                : '0'
                          }%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {milestone.tasks.filter(t => t.status === 'completed').length}/{milestone.tasks.length} tasks
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  className="text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1"
                  value={milestone.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    // Update milestone status
                    fetch(`/api/projects/${params.id}/milestones/${milestone._id}/status`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: e.target.value }),
                    })
                    .then(res => {
                      if (res.ok) fetchProject();
                    })
                    .catch(err => console.error('Error updating milestone status:', err));
                  }}
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                {expandedMilestones.includes(milestone._id) ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                )}
              </div>
            </div>
            
            {/* Tasks */}
            {expandedMilestones.includes(milestone._id) && (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {milestone.tasks.map((task) => (
                  <div 
                    key={task._id} 
                    className={`p-4 ${
                      activeTask?.milestoneId === milestone._id && activeTask?.taskId === task._id
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <button 
                          className="flex-shrink-0"
                          onClick={() => updateTaskStatus(milestone._id, task._id, 
                            task.status === 'not_started' 
                              ? 'in_progress' 
                              : task.status === 'in_progress' 
                                ? 'completed' 
                                : 'not_started'
                          )}
                        >
                          {getStatusIcon(task.status)}
                        </button>
                        <div>
                          <h4 className={`font-medium ${
                            task.status === 'completed' 
                              ? 'text-gray-500 dark:text-gray-400 line-through' 
                              : 'text-gray-800 dark:text-white'
                          }`}>{task.name}</h4>
                          {task.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.notes}</p>
                          )}
                          {task.lastSession && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400">
                              <Clock className="w-3 h-3" />
                              <span>Last session: {task.lastSession.note}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          className={`text-xs px-3 py-1 rounded-full ${
                            activeTask?.milestoneId === milestone._id && activeTask?.taskId === task._id
                              ? 'bg-blue-600 dark:bg-blue-700 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                          onClick={() => setTaskActive(milestone._id, task._id)}
                          disabled={isSubmitting}
                        >
                          {activeTask?.milestoneId === milestone._id && activeTask?.taskId === task._id
                            ? 'Current Task'
                            : 'Work on This'
                          }
                        </button>
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Active Task Section */}
                    {activeTask?.milestoneId === milestone._id && activeTask?.taskId === task._id && (
                      <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                          <MessageSquare className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                          Session Notes
                        </h4>
                        <textarea
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Add notes about your current work session..."
                          rows={3}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                        ></textarea>
                        <div className="flex justify-between mt-3">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Notes help you remember context when you return
                          </div>
                          <button 
                            className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                            onClick={saveNote}
                            disabled={!noteText.trim() || isSubmitting}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Session Control - Fixed at bottom */}
      <div className="fixed bottom-6 right-6">
        {activeSession ? (
          <button 
            onClick={() => endSession(activeSession._id)}
            className="bg-red-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            disabled={isSubmitting}
          >
            <Clock className="w-5 h-5" />
            <span>End Session</span>
          </button>
        ) : (
          <button 
            onClick={() => {
              // Find first incomplete task to start with
              if (project && project.milestones.length > 0) {
                for (const milestone of project.milestones) {
                  if (milestone.status !== 'completed') {
                    const task = milestone.tasks.find(t => t.status !== 'completed');
                    if (task) {
                      setTaskActive(milestone._id, task._id);
                      return;
                    }
                  }
                }
              }
            }}
            className="bg-blue-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            disabled={isSubmitting}
          >
            <Clock className="w-5 h-5" />
            <span>Start Session</span>
          </button>
        )}
      </div>
    </div>
  );
}