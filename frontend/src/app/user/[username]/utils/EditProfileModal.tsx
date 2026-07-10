// app/profile/[username]/utils/EditProfileModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { axiosClient } from '@/app/utils/axiosClient';
import { AxiosError } from 'axios';
import { createPortal } from 'react-dom';

interface ProfileData {
  firstName: string;
  lastName: string;
  username: string;
  emailId: string;
  bio: string;
  location: string;
  gender: string;
  age: number | null;
}

interface EditProfileModalProps {
  profileData: ProfileData;
  onClose: () => void;
  onUpdate: (updatedData: Partial<ProfileData>) => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  username: string;
  bio: string;
  location: string;
  gender: string;
  age: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  age?: string;
}

type UsernameAvailability = 'idle' | 'checking' | 'available' | 'unavailable' | 'invalid';

export default function EditProfileModal({ profileData, onClose, onUpdate }: EditProfileModalProps) {
  const [formData, setFormData] = useState<FormData>({
    firstName: profileData.firstName,
    lastName: profileData.lastName,
    username: profileData.username,
    bio: profileData.bio || '',
    location: profileData.location || '',
    gender: profileData.gender || '',
    age: profileData.age?.toString() || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [usernameStatus, setUsernameStatus] = useState<UsernameAvailability>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const originalUsername = profileData.username;

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

  // Debounced username availability check
  useEffect(() => {
    // Skip check if username hasn't changed or is empty
    if (!formData.username || formData.username === originalUsername) {
      setUsernameStatus('idle');
      return;
    }

    // Validate username format first
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setUsernameStatus('invalid');
      return;
    }

    if (formData.username.length < 3 || formData.username.length > 20) {
      setUsernameStatus('invalid');
      return;
    }

    // Set checking state and debounce API call
    setUsernameStatus('checking');
    
    const timerId = setTimeout(async () => {
      try {
        const response = await axiosClient.get(
          `/api/profile/username-check?username=${formData.username}`
        );
        
        if (response.data.success) {
          setUsernameStatus(response.data.available ? 'available' : 'unavailable');
        }
      } catch (error) {

        const err = error as AxiosError<{ error?: string }>;

        // Optional: log server message
        if (err.response?.data?.error) {
        }

        setUsernameStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timerId);
  }, [formData.username, originalUsername]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof FormErrors];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2 || formData.firstName.length > 50) {
      newErrors.firstName = 'First name must be 2-50 characters';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2 || formData.lastName.length > 50) {
      newErrors.lastName = 'Last name must be 2-50 characters';
    }

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    } else if (formData.username.length < 3 || formData.username.length > 20) {
      newErrors.username = 'Username must be 3-20 characters';
    } else if (formData.username !== originalUsername && usernameStatus === 'unavailable') {
      newErrors.username = 'Username is already taken';
    }

    // Bio validation
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    // Age validation
    if (formData.age) {
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 6 || ageNum > 80) {
        newErrors.age = 'Age must be between 6 and 80';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Wait for username check if it's still checking
    if (usernameStatus === 'checking') {
      setSubmitError('Please wait while we check username availability');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: Partial<ProfileData> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        bio: formData.bio,
        location: formData.location,
        gender: formData.gender,
      };

      if (formData.age) {
        updateData.age = parseInt(formData.age);
      }

      const response = await axiosClient.patch(
        '/api/profile',
        updateData
      );

      if (response.data.success) {
        onUpdate(response.data.data);
        onClose();
      } else {
        setSubmitError(response.data.error || 'Failed to update profile');
      }
    } catch (error) {
      const err = error as AxiosError<{ error?: string }>;

      setSubmitError(
        err.response?.data?.error || 'An error occurred while updating profile'
      );

    } finally {
      setIsSubmitting(false);
    }
  };

  // Username status indicator
  const getUsernameStatusElement = () => {
    if (formData.username === originalUsername) {
      return null;
    }

    switch (usernameStatus) {
      case 'checking':
        return (
          <div className="flex items-center gap-2 text-blue-400 text-sm mt-1">
            <Loader2 className="animate-spin" />
            <span>Checking availability...</span>
          </div>
        );
      case 'available':
        return (
          <div className="flex items-center gap-2 text-green-400 text-sm mt-1">
            <Check />
            <span>Username is available</span>
          </div>
        );
      case 'unavailable':
        return (
          <div className="flex items-center gap-2 text-error text-sm mt-1">
            <AlertCircle />
            <span>Username is already taken</span>
          </div>
        );
      case 'invalid':
        return (
          <div className="flex items-center gap-2 text-error text-sm mt-1">
            <AlertCircle />
            <span>Invalid username format</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] isolate flex items-center justify-center bg-black/90 p-4">
      <div className="relative z-[10000] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-primary bg-primary shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary">
          <h2 className="text-2xl font-bold text-primary">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors"
            disabled={isSubmitting}
            aria-label="Close dialog"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Alert */}
          {submitError && (
            <div className="bg-error-light border border-error rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-error flex-shrink-0 mt-0.5" />
              <p className="text-error text-sm">{submitError}</p>
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-secondary mb-2">
                First Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-secondary border ${
                  errors.firstName ? 'border-error' : 'border-primary'
                } rounded-lg text-primary focus:outline-none focus:border-focus transition-colors`}
                disabled={isSubmitting}
              />
              {errors.firstName && (
                <p className="text-error text-sm mt-1">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-secondary mb-2">
                Last Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-secondary border ${
                  errors.lastName ? 'border-error' : 'border-primary'
                } rounded-lg text-primary focus:outline-none focus:border-focus transition-colors`}
                disabled={isSubmitting}
              />
              {errors.lastName && (
                <p className="text-error text-sm mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-secondary mb-2">
              Username <span className="text-error">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`w-full px-4 py-2 bg-secondary border ${
                errors.username ? 'border-error' : 'border-primary'
              } rounded-lg text-primary focus:outline-none focus:border-focus transition-colors`}
              disabled={isSubmitting}
            />
            {getUsernameStatusElement()}
            {errors.username && (
              <p className="text-error text-sm mt-1">{errors.username}</p>
            )}
            <p className="text-muted text-xs mt-1">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-secondary mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              className={`w-full px-4 py-2 bg-secondary border ${
                errors.bio ? 'border-error' : 'border-primary'
              } rounded-lg text-primary focus:outline-none focus:border-focus transition-colors resize-none`}
              placeholder="Tell us about yourself..."
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.bio && <p className="text-error text-sm">{errors.bio}</p>}
              <p className="text-gray-400 text-xs ml-auto">
                {formData.bio.length}/500
              </p>
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-secondary mb-2">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-secondary border border-primary rounded-lg text-primary focus:outline-none focus:border-focus transition-colors"
              placeholder="City, Country"
              disabled={isSubmitting}
            />
          </div>

          {/* Gender and Age */}
          <div className="grid grid-cols-2 gap-4">
            {/* Gender */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-secondary mb-2">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-secondary border border-primary rounded-lg text-primary focus:outline-none focus:border-focus transition-colors"
                disabled={isSubmitting}
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Age */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-secondary mb-2">
                Age
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="6"
                max="80"
                className={`w-full px-4 py-2 bg-secondary border ${
                  errors.age ? 'border-error' : 'border-primary'
                } rounded-lg text-primary focus:outline-none focus:border-focus transition-colors`}
                disabled={isSubmitting}
              />
              {errors.age && (
                <p className="text-error text-sm mt-1">{errors.age}</p>
              )}
            </div>
          </div>

          {/* Email (Read-only) */}
          <div>
            <label htmlFor="emailId" className="block text-sm font-medium text-secondary mb-2">
              Email
            </label>
            <input
              type="email"
              id="emailId"
              value={profileData.emailId}
              className="w-full px-4 py-2 bg-secondary border border-primary rounded-lg text-muted cursor-not-allowed"
              disabled
            />
            <p className="text-muted text-xs mt-1">Email cannot be changed</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-primary">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-secondary hover:text-primary transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || usernameStatus === 'checking' || usernameStatus === 'unavailable'}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
