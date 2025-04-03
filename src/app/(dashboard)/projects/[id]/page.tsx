'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MoreVertical, 
  Edit2, 
  Calendar
} from 'lucide-react';
import WorkSession from '@/components/WorkSession';

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

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<{ milestoneId: string; taskId: string } | null>(null);

  // Fetch project and active session on mount
  useEffect(() => {
    fetchProject();
  }, [params.id]);

  // Fetch project data
  const fetchProject = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/projects/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }
      
      const data = await response.json();
      setProject(data);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  // Complete a task
  const completeTask = async (milestoneId: string, taskId: string) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/milestones/${milestoneId}/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete task');
      }

      fetchProject(); // Refresh project data
    } catch (err) {
      console.error('Error completing task:', err);
      setError('Failed to complete task');
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
  
  // Calculate remaining days until deadline
  const getDaysRemaining = (deadline?: string) => {
    if (!deadline) return null;
    
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Function to handle session end
  const handleSessionEnd = () => {
    // Refresh project data to update task status
    fetchProject();
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

  return (
    <div className="container mx-auto px-4 py-8">
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
      
      {/* Work Session Component */}
      {selectedTask && (
        <WorkSession
          projectId={params.id}
          milestoneId={selectedTask.milestoneId}
          taskId={selectedTask.taskId}
          onSessionEnd={handleSessionEnd}
        />
      )}
      
      {/* Task List */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Tasks</h2>
        {project.milestones.map((milestone) => (
          <div key={milestone._id} className="mb-6">
            <h3 className="text-lg font-medium mb-2">{milestone.name}</h3>
            <div className="space-y-2">
              {milestone.tasks.map((task) => (
                <div
                  key={task._id}
                  className={`p-4 border rounded-md ${
                    task.status === 'completed'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{task.name}</h4>
                      {task.notes && (
                        <p className="text-sm text-gray-600 mt-1">{task.notes}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {task.status !== 'completed' && (
                        <>
                          <button
                            onClick={() => setSelectedTask({ milestoneId: milestone._id, taskId: task._id })}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Start Session
                          </button>
                          <button
                            onClick={() => completeTask(milestone._id, task._id)}
                            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Complete
                          </button>
                        </>
                      )}
                      {task.status === 'completed' && (
                        <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}