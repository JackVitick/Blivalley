'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronUp, 
  MoreVertical, 
  Search,
  CalendarDays
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

export default function ProjectsPage() {
  const { status } = useSession();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter projects based on search query
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch projects when component mounts
  useEffect(() => {
    if (status === 'authenticated') {
      fetchProjects();
    }
  }, [status, activeTab]);

  // Function to fetch projects based on active tab
  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects?status=${activeTab}`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Error loading projects. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle project expansion
  const toggleProject = (projectId: string) => {
    if (expandedProject === projectId) {
      setExpandedProject(null);
    } else {
      setExpandedProject(projectId);
    }
  };

  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate time since last update
  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 0) {
      return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
    } else if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'Just now';
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

  // Find a task that was last worked on
  const findLastWorkedTask = (project: Project) => {
    for (const milestone of project.milestones) {
      for (const task of milestone.tasks) {
        if (task.lastSession) {
          return {
            task,
            milestone
          };
        }
      }
    }
    return null;
  };

  // Function to delete a project
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      // Remove the project from the local state
      setProjects(projects.filter(p => p._id !== projectId));
      setShowDropdown(null);
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project. Please try again.');
    }
  };

  // Toggle dropdown menu
  const toggleDropdown = (projectId: string) => {
    setShowDropdown(showDropdown === projectId ? null : projectId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown && !(event.target as Element).closest('.dropdown-menu')) {
        setShowDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Projects</h1>
        <Link 
          href="/projects/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search projects..."
          className="w-full p-3 pl-10 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'active'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            Active Projects
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'completed'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            Completed Projects
          </button>
        </nav>
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg p-4">
          {error}
        </div>
      )}
      
      {/* Empty State */}
      {!isLoading && !error && filteredProjects.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-10 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4">
            <Plus className="w-7 h-7" />
          </div>
          <h3 className="text-gray-800 dark:text-gray-200 font-medium mb-1">
            {activeTab === 'active' ? "No active projects" : "No completed projects"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {activeTab === 'active' 
              ? "Create a new project to get started tracking your progress" 
              : "Complete projects will appear here once finished"}
          </p>
          {activeTab === 'active' && (
            <Link 
              href="/projects/new"
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Project
            </Link>
          )}
        </div>
      )}
      
      {/* Projects List */}
      {!isLoading && !error && filteredProjects.length > 0 && (
        <div className="space-y-4">
          {filteredProjects.map(project => (
            <div key={project._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              {/* Project Header */}
              <div className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center" 
                    style={{
                      backgroundColor: `hsl(${parseInt(project._id.substring(0, 6), 16) % 360}, 70%, 90%)`,
                      color: `hsl(${parseInt(project._id.substring(0, 6), 16) % 360}, 70%, 30%)`
                    }}
                  >
                    <span className="font-medium">{project.name.substring(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-800 dark:text-white">{project.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{project.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Updated: {getTimeSince(project.updatedAt)}
                  </div>
                  <div className="relative w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full rounded-full ${
                        project.progress >= 70 
                          ? 'bg-green-500 dark:bg-green-400' 
                          : 'bg-blue-500 dark:bg-blue-400'
                      }`}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                  <button 
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    onClick={() => toggleProject(project._id)}
                  >
                    {expandedProject === project._id ? (
                      <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    )}
                  </button>
                  <div className="relative">
                    <button 
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                      onClick={() => toggleDropdown(project._id)}
                    >
                      <MoreVertical className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                    {showDropdown === project._id && (
                      <div className="dropdown-menu absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-10">
                        <button
                          onClick={() => handleDeleteProject(project._id)}
                          className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Delete Project
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Last Session Note */}
              {activeTab === 'active' && (
                <>
                  {findLastWorkedTask(project) ? (
                    <div className="px-4 py-2 border-t border-b border-gray-100 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 flex items-center gap-2">
                      <Clock className="text-blue-500 dark:text-blue-400 w-4 h-4" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Last session:</span> {findLastWorkedTask(project)?.task.lastSession?.note}
                      </span>
                    </div>
                  ) : (
                    project.milestones.length > 0 && (
                      <div className="px-4 py-2 border-t border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Ready to begin working on {project.milestones[0].name}
                        </span>
                      </div>
                    )
                  )}
                </>
              )}
              
              {/* Expanded Content */}
              {expandedProject === project._id && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-700 dark:text-gray-300">Milestones</h3>
                    {project.deadline && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <CalendarDays className="w-4 h-4" />
                        <span>Deadline: {formatDate(project.deadline)}</span>
                      </div>
                    )}
                  </div>
                  
                  {project.milestones.length > 0 ? (
                    <div className="space-y-2">
                      {project.milestones.map(milestone => (
                        <div key={milestone._id} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700/30 rounded-lg">
                          {getStatusIcon(milestone.status)}
                          <span className={`flex-1 ${
                            milestone.status === 'completed' 
                              ? 'text-gray-500 dark:text-gray-400' 
                              : 'text-gray-800 dark:text-gray-200'
                          }`}>
                            {milestone.name}
                          </span>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {milestone.tasks.filter(t => t.status === 'completed').length} / {milestone.tasks.length} tasks
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No milestones defined for this project.</p>
                  )}
                  
                  <div className="mt-4 flex justify-end">
                    <Link
                      href={`/projects/${project._id}`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1"
                    >
                      View Project Details
                      <ChevronDown className="w-4 h-4 rotate-270" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 