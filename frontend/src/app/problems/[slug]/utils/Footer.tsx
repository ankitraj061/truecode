'use client'

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";
import { axiosClient } from "@/app/utils/axiosClient";
import FeedbackModal from "@/app/components/Feedback";
import { AxiosError } from "axios";

export default function ProblemFooter() {
  const { problem, userStatus } = useSelector((state: RootState) => state.problem);
  
  // Footer states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocalSaved, setIsLocalSaved] = useState(userStatus?.isSavedProblem || false);

  // Update local saved state when userStatus changes
  useEffect(() => {
    setIsLocalSaved(userStatus?.isSavedProblem || false);
  }, [userStatus?.isSavedProblem]);

  // Toggle save problem
  const handleSaveProblem = async () => {
    if (!problem?._id || isSaving) return;

    setIsSaving(true);
    
    try {
      const response = await axiosClient.post(`/api/user/problem/save/${problem._id}`);
      
      if (response.data.success) {
        // Toggle local state immediately for better UX
        setIsLocalSaved(!isLocalSaved);
      }
    } catch (error: unknown) {
      let errorMessage = 'Failed to save problem';

      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.message || errorMessage;
      }

      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Open feedback modal
  const handleFeedbackClick = () => {
    setShowFeedbackModal(true);
  };

  // Close feedback modal
  const handleCloseFeedbackModal = () => {
    setShowFeedbackModal(false);
  };

  return (
    <>
      {/* Footer */}
      <div className="border-t border-primary bg-primary px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left - Copyright */}
          <div className="text-xs text-tertiary">
            © 2025 TrueCode. All rights reserved.
          </div>

          {/* Right - Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Save Problem Button */}
            <button
              onClick={handleSaveProblem}
              disabled={isSaving}
              className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all interactive ${
                isLocalSaved
                  ? 'bg-accent-light text-accent border border-accent'
                  : 'bg-secondary text-secondary border border-primary hover:bg-tertiary'
              } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}`}
              title={isLocalSaved ? 'Problem saved' : 'Save problem'}
            >
              {isSaving ? (
                <div className="skeleton w-3 h-3 rounded-full"></div>
              ) : (
                <svg 
                  className="w-4 h-4" 
                  fill={isLocalSaved ? "currentColor" : "none"} 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
                  />
                </svg>
              )}
              <span>{isLocalSaved ? 'Saved' : 'Save'}</span>
            </button>

            {/* Feedback Button */}
            <button
              onClick={handleFeedbackClick}
              className="btn-secondary flex items-center space-x-1 px-3 py-1.5 text-xs font-medium interactive"
              title="Send feedback"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                />
              </svg>
              <span>Feedback</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedbackModal} 
        onClose={handleCloseFeedbackModal} 
      />
    </>
  );
}
