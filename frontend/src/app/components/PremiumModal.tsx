import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '../problems/utils/types';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  problemTitle: string;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, problemTitle }) => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  // If user has premium access, don't render modal at all
  if (user?.subscriptionType === 'premium') {
    return null;
  }
 

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubscribe = () => {
    // Navigate to premium subscription page
    router.push('/premium');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-modal backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-elevated rounded-3xl shadow-xl max-w-md w-full mx-4 overflow-hidden animate-slide-up border border-primary">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-warning/20 via-accent/20 to-warning/20 p-8 border-b border-primary">
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-primary/80 hover:bg-primary border border-primary hover:border-tertiary text-secondary hover:text-primary transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center group"
          >
            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Lock Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-warning to-accent rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-inverse" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              </div>
              <div className="absolute top-5 right-5 w-6 h-6 bg-warning rounded-full animate-ping"></div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-center text-primary mb-2">
            Subscribe to unlock.
          </h2>
        </div>
        
        {/* Content */}
        <div className="p-8 text-center">
          {/* Main Message */}
          <div className="mb-8">
            <p className="text-lg text-secondary mb-6 leading-relaxed">
              Thanks for using <span className="font-bold text-brand">TrueCode</span>! To view this question you must subscribe to premium.
            </p>
            
            {/* Problem Title */}
            <div className="bg-tertiary/20 rounded-2xl p-4 border border-primary mb-6">
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-8 bg-warning/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="font-semibold text-primary">
                  &quot;{problemTitle}&quot;
                </span>
              </div>
            </div>
          </div>

          {/* Single Subscribe Button */}
        <button
  onClick={handleSubscribe}
  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 group relative overflow-hidden"
>
  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
  <span className="relative flex items-center justify-center gap-3 text-white">
    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
    <span className="text-lg text-white">Subscribe</span>
    <svg className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  </span>
</button>


          {/* Simple Benefits */}
          <div className="mt-8 pt-6 border-t border-primary">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3">
                <div className="w-8 h-8 bg-brand/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg">🔓</span>
                </div>
                <span className="text-xs text-secondary font-medium">All Problems</span>
              </div>
              <div className="p-3">
                <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg">📚</span>
                </div>
                <span className="text-xs text-secondary font-medium">Solutions</span>
              </div>
              <div className="p-3">
                <div className="w-8 h-8 bg-warning/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg">🎥</span>
                </div>
                <span className="text-xs text-secondary font-medium">Explanations</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
