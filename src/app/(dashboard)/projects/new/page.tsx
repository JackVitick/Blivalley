'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Plus, X } from 'lucide-react';

interface ProjectData {
  name: string;
  description: string;
  category: string;
  deadline: string;
  status: 'active' | 'completed' | 'archived';
  settings: {
    autoStart: boolean;
    notifications: boolean;
  };
  milestones: {
    name: string;
    tasks: string[];
  }[];
}

export default function NewProject() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    description: '',
    category: '',
    deadline: '',
    status: 'active',
    settings: {
      autoStart: false,
      notifications: true
    },
    milestones: []
  });

  const totalSteps = 4;

  // Validate if current step is complete
  const isStepComplete = () => {
    switch (step) {
      case 1:
        return projectData.name.trim() !== '' && projectData.category.trim() !== '';
      case 2:
        return true; // Description is optional
      case 3:
        return projectData.milestones.length > 0 && 
               projectData.milestones.every(m => m.name.trim() !== '');
      case 4:
        return true; // Tasks are optional
      default:
        return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setProjectData({
      ...projectData,
      [e.target.name]: e.target.value
    });
  };

  const addMilestone = () => {
    setProjectData({
      ...projectData,
      milestones: [...projectData.milestones, { name: '', tasks: [] }]
    });
  };

  const updateMilestone = (index: number, value: string) => {
    const newMilestones = [...projectData.milestones];
    newMilestones[index].name = value;
    setProjectData({
      ...projectData,
      milestones: newMilestones
    });
  };

  const removeMilestone = (index: number) => {
    const newMilestones = [...projectData.milestones];
    newMilestones.splice(index, 1);
    setProjectData({
      ...projectData,
      milestones: newMilestones
    });
  };

  const addTask = (milestoneIndex: number) => {
    const newMilestones = [...projectData.milestones];
    newMilestones[milestoneIndex].tasks.push('');
    setProjectData({
      ...projectData,
      milestones: newMilestones
    });
  };

  const updateTask = (milestoneIndex: number, taskIndex: number, value: string) => {
    const newMilestones = [...projectData.milestones];
    newMilestones[milestoneIndex].tasks[taskIndex] = value;
    setProjectData({
      ...projectData,
      milestones: newMilestones
    });
  };

  const removeTask = (milestoneIndex: number, taskIndex: number) => {
    const newMilestones = [...projectData.milestones];
    newMilestones[milestoneIndex].tasks.splice(taskIndex, 1);
    setProjectData({
      ...projectData,
      milestones: newMilestones
    });
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleCreateProject();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Create project via API
  const handleCreateProject = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Transform milestones data to match the schema
      const transformedMilestones = projectData.milestones.map(milestone => ({
        name: milestone.name,
        status: 'not_started',
        tasks: milestone.tasks.map(taskName => ({
          name: taskName,
          status: 'not_started',
          notes: ''
        }))
      }));

      // Format the data for the API
      const projectPayload = {
        ...projectData,
        milestones: transformedMilestones,
        deadline: projectData.deadline ? new Date(projectData.deadline).toISOString() : null
      };

      console.log('Sending project data:', JSON.stringify(projectPayload, null, 2));

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectPayload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }
      
      const data = await response.json();
      
      // Redirect to the new project page
      router.push(`/projects/${data._id}`);
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while creating the project');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Progress indicator */}
        <div className="px-6 pt-6">
          <div className="flex justify-between mb-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step > index + 1 
                      ? 'bg-green-500 text-white dark:bg-green-600' 
                      : step === index + 1 
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {step > index + 1 ? (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                {index < totalSteps - 1 && (
                  <div
                    className={`h-1 w-16 mt-4 ${
                      step > index + 1 
                        ? 'bg-green-500 dark:bg-green-600' 
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1: Project Name & Category */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">What project would you like to track?</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Give your project a clear, meaningful name</p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Website Redesign, Book Draft, Kitchen Renovation"
                    value={projectData.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category (Optional)
                  </label>
                  <select
                    id="category"
                    name="category"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
                    value={projectData.category}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a category</option>
                    <option value="design">Design</option>
                    <option value="development">Development</option>
                    <option value="writing">Writing</option>
                    <option value="marketing">Marketing</option>
                    <option value="business">Business</option>
                    <option value="education">Education</option>
                    <option value="personal">Personal</option>
                    <option value="home">Home & DIY</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Project Description & Deadline */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Tell me more about this project</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">A brief description helps you stay focused on your goals</p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Redesigning the company website to improve user experience and conversion rates..."
                    value={projectData.description}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deadline (Optional)
                  </label>
                  <input
                    id="deadline"
                    name="deadline"
                    type="date"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    value={projectData.deadline}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Milestones */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">What are the main phases of this project?</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Break down your project into major milestones</p>

              <div className="space-y-3">
                {projectData.milestones.length > 0 ? (
                  projectData.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </div>
                      <input
                        type="text"
                        placeholder="e.g., Research, Design, Development, Testing"
                        className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        value={milestone.name}
                        onChange={(e) => updateMilestone(index, e.target.value)}
                      />
                      <button
                        onClick={() => removeMilestone(index)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                    <p className="text-gray-500 dark:text-gray-400">No milestones added yet</p>
                  </div>
                )}
                
                <button
                  onClick={addMilestone}
                  className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-4"
                >
                  <Plus size={20} />
                  Add Milestone
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Tasks */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Let's break down your milestones</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Add specific tasks to each milestone</p>
              
              <div className="space-y-6">
                {projectData.milestones.map((milestone, milestoneIndex) => (
                  <div key={milestoneIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm">
                        {milestoneIndex + 1}
                      </div>
                      <span>{milestone.name || `Milestone ${milestoneIndex + 1}`}</span>
                    </h3>
                    
                    <div className="space-y-2 ml-8">
                      {milestone.tasks && milestone.tasks.length > 0 ? (
                        milestone.tasks.map((task, taskIndex) => (
                          <div key={taskIndex} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Enter task description"
                              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              value={task}
                              onChange={(e) => updateTask(milestoneIndex, taskIndex, e.target.value)}
                            />
                            <button
                              onClick={() => removeTask(milestoneIndex, taskIndex)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          No tasks added yet
                        </div>
                      )}
                      
                      <button
                        onClick={() => addTask(milestoneIndex)}
                        className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm mt-2"
                      >
                        <Plus size={16} />
                        Add Task
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                step === 1 
                  ? 'invisible' 
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!isStepComplete() || isSubmitting}
              className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating...</span>
                </div>
              ) : (
                <>
                  {step === totalSteps ? 'Create Project' : 'Continue'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}