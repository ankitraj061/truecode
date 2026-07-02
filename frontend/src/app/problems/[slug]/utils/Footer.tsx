'use client'

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";
import { axiosClient } from "@/app/utils/axiosClient";
import FeedbackModal from "@/app/components/Feedback";
import { AxiosError } from "axios";
import { Bookmark, MessageCircle } from "lucide-react";

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
                <Bookmark className="w-4 h-4" fill={isLocalSaved ? "currentColor" : "none"} />
              )}
              <span>{isLocalSaved ? 'Saved' : 'Save'}</span>
            </button>

            {/* Feedback Button */}
            <button
              onClick={handleFeedbackClick}
              className="btn-secondary flex items-center space-x-1 px-3 py-1.5 text-xs font-medium interactive"
              title="Send feedback"
            >
              <MessageCircle className="w-4 h-4" />
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
