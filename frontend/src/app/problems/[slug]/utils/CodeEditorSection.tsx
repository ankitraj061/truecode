'use client'

import { useState, useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import { axiosClient } from '@/app/utils/axiosClient';
import { Monaco } from '@monaco-editor/react';
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';
import type { StartCodeEntry } from '@/app/problems/[slug]/utils/types';
import type { AxiosError } from 'axios';

export default function CodeEditorSection() {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(14);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [confirmAction, setConfirmAction] = useState<'reset' | 'lastSubmission' | null>(null);
  
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { problem, userStatus } = useSelector((state: RootState) => state.problem);
  
  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
  ];

  // Expose code data globally for Navbar component
  useEffect(() => {
    window.codeEditorData = {
      code: code,
      language: selectedLanguage
    };
  }, [code, selectedLanguage]);

  // Listen for run events to provide real-time feedback
  useEffect(() => {
    const handleRunStarted = (event?: Event) => {
      // Run started
    };

    const handleRunCompleted = (event: Event) => {
      const customEvent = event as CustomEvent<{
        success?: boolean;
        summary?: { passedTests?: number; totalTests?: number };
      }>;
      // Run completed
    };

    window.addEventListener('runStarted', handleRunStarted as EventListener);
    window.addEventListener('runCompleted', handleRunCompleted as EventListener);

    return () => {
      window.removeEventListener('runStarted', handleRunStarted as EventListener);
      window.removeEventListener('runCompleted', handleRunCompleted as EventListener);
    };
  }, []);

  // Fullscreen functionality
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Keep Monaco theme in sync with the actual app theme class on <html>.
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const updateThemeFromDom = () => {
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    };

    updateThemeFromDom();

    const observer = new MutationObserver(updateThemeFromDom);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Zoom functions
  const zoomIn = () => {
    setFontSize(prev => Math.min(prev + 2, 28));
  };

  const zoomOut = () => {
    setFontSize(prev => Math.max(prev - 2, 10));
  };

  // Get the start code for the selected language from problem data
  const getStartCodeForLanguage = (language: string): string => {
    if (!problem?.startCode) {
      return getDefaultFallbackCode(language);
    }

    const startCodeEntry = problem.startCode.find(
      (entry: StartCodeEntry) => entry.language === language
    );
    
    return startCodeEntry?.initialCode || getDefaultFallbackCode(language);
  };

  // Fallback templates in case problem data is not available
  function getDefaultFallbackCode(language: string): string {
    const templates = {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    
};`,
      python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        pass`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        
    }
}`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        
    }
};`,
      c: `/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* twoSum(int* nums, int numsSize, int target, int* returnSize){
    
}`
    };
    return templates[language as keyof typeof templates] || '';
  }

  // Check if draft exists for current problem and language
  const checkDraftExists = useCallback(async (): Promise<boolean> => {
    if (!problem?._id) return false;
    
    try {
      const response = await axiosClient.get(`/api/problems/${problem._id}/draft`);
      return response.data.success && response.data.draft && 
             response.data.draft.language === selectedLanguage;
    } catch (error) {
      return false;
    }
  }, [problem?._id, selectedLanguage]);

  // Save draft function with debouncing
  const saveDraft = useCallback(async (codeToSave: string, language: string) => {
    if (!problem?._id || !codeToSave.trim()) return;

    setIsSavingDraft(true);
    setSaveStatus('saving');

    try {
      setEditorError(null);
      const response = await axiosClient.post(`/api/problems/${problem._id}/draft`, {
        code: codeToSave,
        language: language
      });

      if (response.data.success) {
        if (response.data.saved) {
          setLastSaveTime(new Date());
          setSaveStatus('saved');
        } else {
          setSaveStatus(null);
        }
      }
    } catch (error: unknown) {
      setSaveStatus('error');
      setEditorError('Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  }, [problem?._id]);

  // Debounced save function
  const debouncedSave = useCallback((codeToSave: string, language: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDraft(codeToSave, language);
    }, 2000);
  }, [saveDraft]);

  // Load draft function
  const loadDraft = useCallback(async (language: string) => {
    if (!problem?._id) return null;

    setIsLoadingDraft(true);

    try {
      setEditorError(null);
      const response = await axiosClient.get(`/api/problems/${problem._id}/draft`);

      if (response.data.success && response.data.draft) {
        const draft = response.data.draft;
        
        if (draft.language === language) {
          return draft.code;
        }
      }
      
      return null;
    } catch (error: unknown) {
      setEditorError('Failed to load draft');
      return null;
    } finally {
      setIsLoadingDraft(false);
    }
  }, [problem?._id]);

  // Initialize code when component mounts or problem changes
  useEffect(() => {
    if (problem) {
      const preferredLang = userStatus?.preferredLanguage || 'javascript';
      
      const isPreferredLangSupported = languages.some(lang => lang.value === preferredLang);
      const initialLanguage = isPreferredLangSupported ? preferredLang : 'javascript';
      
      setSelectedLanguage(initialLanguage);
      
      loadDraft(initialLanguage).then(draftCode => {
        const codeToUse = draftCode || getStartCodeForLanguage(initialLanguage);
        setCode(codeToUse);
      });
    }
  }, [problem, userStatus, loadDraft]);

  // Handle code changes with auto-save
  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    
    if (newCode.trim()) {
      debouncedSave(newCode, selectedLanguage);
    }
  };

  // Handle language change
  const handleLanguageChange = async (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    
    const draftCode = await loadDraft(newLanguage);
    const newCode = draftCode || getStartCodeForLanguage(newLanguage);
    
    setCode(newCode);
    
    if (editorRef.current) {
      editorRef.current.setValue(newCode);
    }
  };

  // Enhanced custom themes with better eye comfort
  const defineCustomThemes = (monaco: Monaco) => {
    // Enhanced Dark Theme - Eye Comfort Optimized
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        // Comments - Soft green with good contrast
        { token: 'comment', foreground: '7C9885', fontStyle: 'italic' },
        { token: 'comment.line', foreground: '7C9885', fontStyle: 'italic' },
        { token: 'comment.block', foreground: '7C9885', fontStyle: 'italic' },
        
        // Keywords - Vibrant blue but not harsh
        { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'keyword.control', foreground: 'C586C0' },
        { token: 'keyword.operator', foreground: 'D4D4D4' },
        
        // Strings - Warm orange/amber
        { token: 'string', foreground: 'CE9178' },
        { token: 'string.escape', foreground: 'D7BA7D' },
        
        // Numbers - Soft mint green
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'number.hex', foreground: 'B5CEA8' },
        
        // Functions - Light blue
        { token: 'entity.name.function', foreground: 'DCDCAA', fontStyle: 'bold' },
        { token: 'support.function', foreground: 'DCDCAA' },
        
        // Types and Classes - Teal
        { token: 'entity.name.type', foreground: '4EC9B0', fontStyle: 'bold' },
        { token: 'entity.name.class', foreground: '4EC9B0', fontStyle: 'bold' },
        { token: 'support.type', foreground: '4EC9B0' },
        { token: 'support.class', foreground: '4EC9B0' },
        
        // Variables - Light gray
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'variable.parameter', foreground: '9CDCFE' },
        
        // Operators - Light gray
        { token: 'keyword.operator', foreground: 'D4D4D4' },
        { token: 'punctuation', foreground: 'D4D4D4' },
        
        // Special tokens
        { token: 'constant', foreground: '569CD6' },
        { token: 'constant.language', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'support.constant', foreground: '569CD6' },
        
        // Preprocessor
        { token: 'meta.preprocessor', foreground: 'C586C0' },
        
        // Tags (for HTML-like syntax)
        { token: 'entity.name.tag', foreground: '569CD6' },
        { token: 'entity.other.attribute-name', foreground: '92C5F7' },
      ],
      colors: {
        // Editor background — green-tinted dark
        'editor.background': '#0D1710',
        'editor.foreground': '#D4E8D0',

        // Line highlighting
        'editor.lineHighlightBackground': '#132218',
        'editor.lineHighlightBorder': '#1E3A28',

        // Selection — green-tinted
        'editor.selectionBackground': '#2D6A4F55',
        'editor.selectionHighlightBackground': '#52B78826',

        // Cursor — green
        'editor.cursor': '#52B788',

        // Line numbers
        'editorLineNumber.foreground': '#4A7060',
        'editorLineNumber.activeForeground': '#95D5B2',

        // Gutter
        'editorGutter.background': '#0D1710',

        // Scrollbar
        'scrollbarSlider.background': '#4A706066',
        'scrollbarSlider.hoverBackground': '#4A706099',
        'scrollbarSlider.activeBackground': '#4A7060CC',

        // Bracket matching
        'editorBracketMatch.background': '#52B78833',
        'editorBracketMatch.border': '#52B788',

        // Find/Replace
        'editor.findMatchBackground': '#74C69D44',
        'editor.findMatchHighlightBackground': '#74C69D22',

        // Error/Warning underlines
        'editorError.foreground': '#F85149',
        'editorWarning.foreground': '#F2CC60',
        'editorInfo.foreground': '#74C69D',

        // Widget backgrounds
        'editorWidget.background': '#112015',
        'editorWidget.border': '#1E3A28',

        // Hover widget
        'editorHoverWidget.background': '#112015',
        'editorHoverWidget.border': '#1E3A28',

        // Suggest widget
        'editorSuggestWidget.background': '#112015',
        'editorSuggestWidget.border': '#1E3A28',
        'editorSuggestWidget.selectedBackground': '#2D6A4F55',
      }
    });
    
    // Enhanced Light Theme - Eye Comfort Optimized
    monaco.editor.defineTheme('custom-light', {
      base: 'vs',
      inherit: true,
      rules: [
        // Comments - Muted green
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'comment.line', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'comment.block', foreground: '6A9955', fontStyle: 'italic' },
        
        // Keywords - Deep blue
        { token: 'keyword', foreground: '0451A5', fontStyle: 'bold' },
        { token: 'keyword.control', foreground: 'AF00DB' },
        
        // Strings - Warm brown
        { token: 'string', foreground: 'A31515' },
        { token: 'string.escape', foreground: 'E3116C' },
        
        // Numbers - Forest green
        { token: 'number', foreground: '098658' },
        
        // Functions - Golden brown
        { token: 'entity.name.function', foreground: '795E26', fontStyle: 'bold' },
        { token: 'support.function', foreground: '795E26' },
        
        // Types and Classes - Teal
        { token: 'entity.name.type', foreground: '267F99', fontStyle: 'bold' },
        { token: 'entity.name.class', foreground: '267F99', fontStyle: 'bold' },
        { token: 'support.type', foreground: '267F99' },
        { token: 'support.class', foreground: '267F99' },
        
        // Variables - Dark blue
        { token: 'variable', foreground: '001080' },
        { token: 'variable.parameter', foreground: '001080' },
        
        // Constants
        { token: 'constant', foreground: '0451A5' },
        { token: 'constant.language', foreground: '0451A5', fontStyle: 'bold' },
        
        // Operators
        { token: 'keyword.operator', foreground: '000000' },
        { token: 'punctuation', foreground: '000000' },
      ],
      colors: {
        // Editor background - Warm white
        'editor.background': '#FEFEFE',
        'editor.foreground': '#24292F',
        
        // Line highlighting
        'editor.lineHighlightBackground': '#F6F8FA',
        'editor.lineHighlightBorder': '#E1E4E8',
        
        // Selection
        'editor.selectionBackground': '#0969DA33',
        'editor.selectionHighlightBackground': '#0969DA22',
        
        // Cursor
        'editor.cursor': '#7C3AED',
        
        // Line numbers
        'editorLineNumber.foreground': '#656D76',
        'editorLineNumber.activeForeground': '#24292F',
        
        // Gutter
        'editorGutter.background': '#FEFEFE',
        
        // Scrollbar
        'scrollbarSlider.background': '#656D7666',
        'scrollbarSlider.hoverBackground': '#656D7699',
        'scrollbarSlider.activeBackground': '#656D76CC',
        
        // Bracket matching
        'editorBracketMatch.background': '#17E5E633',
        'editorBracketMatch.border': '#17E5E6',
        
        // Find/Replace
        'editor.findMatchBackground': '#FFDF5D44',
        'editor.findMatchHighlightBackground': '#FFDF5D22',
      }
    });
  };

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    defineCustomThemes(monaco);
    monaco.editor.setTheme(theme === 'dark' ? 'custom-dark' : 'custom-light');
    
    editor.focus();
    
    setIsEditorReady(true);
    
    // Add keyboard shortcut for format only
    editor.addAction({
      id: 'format-code',
      label: 'Format Code',
      keybindings: [monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF],
      run: () => {
        handleFormat();
      }
    });
  };

  // Update theme when changed
  useEffect(() => {
    if (monacoRef.current && isEditorReady) {
      monacoRef.current.editor.setTheme(theme === 'dark' ? 'custom-dark' : 'custom-light');
    }
  }, [theme, isEditorReady]);

  // Reset to starter code and delete draft
  const handleReset = () => {
    if (!problem?._id) return;
    setConfirmAction('reset');
  };

  const performReset = async () => {
    if (!problem?._id) return;

    setIsResetting(true);
    
    try {
      const hasDraft = await checkDraftExists();
      
      if (hasDraft) {
        await axiosClient.delete(`/api/problems/${problem._id}/draft`);
      }
      
    } catch (error: unknown) {
      const axiosErr = error as AxiosError | undefined;
      setEditorError('Failed to reset draft');
    }
    
    try {
      const defaultCode = getStartCodeForLanguage(selectedLanguage);
      setCode(defaultCode);
      
      if (editorRef.current) {
        editorRef.current.setValue(defaultCode);
      }
      
      setSaveStatus(null);
      setLastSaveTime(null);
      
    } catch (resetError) {
      // Handle error silently
    } finally {
      setIsResetting(false);
    }
  };

  // Format code using backend API
  const handleFormat = async () => {
    if (!editorRef.current || !code.trim()) return;
    
    setIsFormatting(true);
    
    try {
      setEditorError(null);
      const response = await axiosClient.post('/api/format', {
        code: code,
        language: selectedLanguage
      });
      
      if (response.data.success) {
        const formattedCode = response.data.formattedCode;
        setCode(formattedCode);
        editorRef.current.setValue(formattedCode);
        
        saveDraft(formattedCode, selectedLanguage);
      }
    } catch (error: unknown) {
      try {
        await editorRef.current.getAction('editor.action.formatDocument')?.run();
      } catch (monacoError) {
        setEditorError('Failed to format code');
      }
    } finally {
      setIsFormatting(false);
    }
  };

  // Get last submission
  const handleGetLastSubmission = () => {
    if (!problem?._id) return;

    if (!userStatus?.isSubmittedByUser) {
      return;
    }

    setConfirmAction('lastSubmission');
  };

  const performGetLastSubmission = async () => {
    if (!problem?._id) return;

    setIsLoadingSubmission(true);
    
    try {
      const response = await axiosClient.get(`/api/last/${problem._id}`);
      
      if (response.data.success && response.data.hasSubmission) {
        const submission = response.data.submission;
        
        if (submission.language && submission.language !== selectedLanguage) {
          setSelectedLanguage(submission.language);
        }
        
        const submissionCode = submission.code || '';
        setCode(submissionCode);
        
        if (editorRef.current) {
          editorRef.current.setValue(submissionCode);
        }
        
        saveDraft(submissionCode, submission.language || selectedLanguage);
      }
      
    } catch (error: unknown) {
      const axiosErr = error as AxiosError | undefined;
      // Handle error silently
    } finally {
      setIsLoadingSubmission(false);
    }
  };

  // Manual save function
  const handleManualSave = () => {
    if (code.trim()) {
      saveDraft(code, selectedLanguage);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!problem) {
    return (
      <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="flex-shrink-0 flex items-center gap-3 px-3 py-2 border-b" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <div className="skeleton h-6 w-24 rounded" />
          <div className="skeleton h-6 w-16 rounded" />
        </div>
        <div className="flex-1 p-4 space-y-2" style={{ backgroundColor: 'var(--bg-primary)' }}>
          {[60, 85, 45, 72, 90, 55, 40, 68, 80, 50, 63, 75].map((w, i) => (
            <div key={i} className="skeleton h-4 rounded" style={{ width: `${w}%`, marginLeft: i > 0 && i < 9 ? '1.5rem' : undefined }} />
          ))}
        </div>
      </div>
    );
  }

  // Simplified save status indicator - only show loading states
  const SaveStatusIndicator = () => {
    if (isLoadingDraft) {
      return (
        <div className="flex items-center space-x-2 bg-elevated px-3 py-1.5 rounded-lg border border-brand/20 shadow-xs">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-brand"></div>
          <span className="text-xs text-brand font-medium">Loading draft...</span>
        </div>
      );
    }

    if (saveStatus === 'saving') {
      return (
        <div className="flex items-center space-x-2 bg-elevated px-3 py-1.5 rounded-lg border border-brand/20 shadow-xs">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-brand"></div>
          <span className="text-xs text-brand font-medium">Auto-saving...</span>
        </div>
      );
    }

    if (saveStatus === 'saved') {
      return (
        <div className="flex items-center space-x-2 bg-elevated px-3 py-1.5 rounded-lg border border-success/20 shadow-xs">
          <div className="w-2 h-2 rounded-full bg-success"></div>
          <span className="text-xs text-success font-medium">Saved</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-full flex flex-col bg-primary animate-fade-in">
      {/* Enhanced Code Editor Header */}
      <div className="flex items-center justify-between bg-elevated border-b border-primary shadow-xs px-4 py-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-success rounded-full shadow-xs"></div>
            <span className="text-sm font-semibold text-primary">Code Editor</span>
          </div>
          
          {/* Enhanced Language Selector */}
          <div className="relative">
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="input text-sm px-4 py-2 min-w-32 font-mono bg-elevated border-primary shadow-xs"
              disabled={isResetting || isLoadingSubmission || isLoadingDraft}
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Save Status Indicator */}
          <SaveStatusIndicator />
          {editorError && (
            <span className="text-xs text-error">{editorError}</span>
          )}

          {/* Enhanced Zoom Controls */}
          <div className="flex items-center bg-elevated border border-primary rounded-lg shadow-xs overflow-hidden">
            <button
              onClick={zoomOut}
              disabled={fontSize <= 10}
              className="interactive text-secondary hover:text-primary hover:bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 transition-all duration-200"
              title="Decrease font size"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <div className="text-xs text-secondary bg-tertiary px-3 py-2 border-x border-primary font-mono min-w-12 text-center">
              {fontSize}px
            </div>
            <button
              onClick={zoomIn}
              disabled={fontSize >= 28}
              className="interactive text-secondary hover:text-primary hover:bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 transition-all duration-200"
              title="Increase font size"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="interactive bg-elevated hover:bg-tertiary text-secondary hover:text-primary px-3 py-2 rounded-lg border border-primary shadow-xs transition-all duration-200"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Enhanced Action Buttons - Icon Only with Custom Styled Tooltips */}
        <div className="flex items-center space-x-2">
          {/* Reset Button */}
          <div className="relative group">
            <button 
              onClick={handleReset}
              disabled={isResetting}
              className="interactive bg-elevated hover:bg-tertiary text-secondary hover:text-primary px-3 py-2 rounded-lg border border-primary shadow-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResetting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </button>
            {/* Custom Tooltip */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Reset code
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
          
          {/* Format Button */}
         <div className="relative group">
  <button 
    onClick={handleFormat}
    disabled={isFormatting || !code.trim()}
    className="interactive bg-elevated hover:bg-tertiary text-secondary hover:text-primary px-3 py-2 rounded-lg border border-primary shadow-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isFormatting ? (
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )}
  </button>
  {/* Custom Tooltip - Now positioned below */}
  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
    Format code (Alt+Shift+F)
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
  </div>
</div>
          
          {/* Get Last Submission Button */}
          <div className="relative group">
            <button 
              onClick={handleGetLastSubmission}
              disabled={isLoadingSubmission || !userStatus?.isSubmittedByUser}
              className={`interactive px-3 py-2 rounded-lg border shadow-xs transition-all duration-200 ${
                !userStatus?.isSubmittedByUser 
                  ? 'text-muted border-primary cursor-not-allowed opacity-50 bg-tertiary' 
                  : 'bg-elevated hover:bg-tertiary text-secondary hover:text-primary border-primary disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isLoadingSubmission ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </button>
            {/* Custom Tooltip */}
            <div className="absolute top-full left-1/50 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              {!userStatus?.isSubmittedByUser 
                ? "No submissions found" 
                : "Get last submission"
              }
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Monaco Editor with Enhanced Loading */}
      <div className="flex-1 min-h-0 relative">
        <Editor
          height="100%"
          language={selectedLanguage}
          value={code}
          theme={theme === 'dark' ? 'custom-dark' : 'custom-light'}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: fontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
            fontLigatures: true,
            fontWeight: '400',
            lineHeight: 1.6,
            letterSpacing: 0.5,
            
            // Enhanced visual settings for eye comfort
            minimap: { enabled: fontSize < 16 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            renderWhitespace: 'boundary',
            selectOnLineNumbers: true,
            roundedSelection: true,
            readOnly: false,
            cursorStyle: 'line',
            cursorWidth: 2,
            cursorBlinking: 'smooth',
            
            // Indentation
            tabSize: 2,
            insertSpaces: true,
            detectIndentation: false,
            
            // Code folding
            folding: true,
            showFoldingControls: 'mouseover',
            foldingHighlight: true,
            
            // Bracket matching
            matchBrackets: 'always',
            bracketPairColorization: {
              enabled: true,
            },
            
            // Auto formatting
            autoIndent: 'advanced',
            formatOnPaste: true,
            formatOnType: true,
            
            // Smooth scrolling
            smoothScrolling: true,
            
            // Enhanced IntelliSense
            quickSuggestions: {
              other: true,
              comments: false,
              strings: true
            },
            parameterHints: {
              enabled: true,
              cycle: true
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            wordBasedSuggestions: 'currentDocument',
            
            // Hover
            hover: {
              enabled: true,
              delay: 300,
              sticky: true
            },
            
            // Mouse wheel zoom
            mouseWheelZoom: true,
            
            // Enhanced find widget
            find: {
              cursorMoveOnType: true,
              seedSearchStringFromSelection: 'always',
              autoFindInSelection: 'never'
            },
            
            // Accessibility
            accessibilitySupport: 'auto',
            
            // Performance
            renderValidationDecorations: 'on',
            
            // Advanced features
            codeLens: false,
            contextmenu: true,
            copyWithSyntaxHighlighting: true,
            
            // Scrollbar
            scrollbar: {
              useShadows: true,
              verticalHasArrows: false,
              horizontalHasArrows: false,
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 12,
              horizontalScrollbarSize: 12,
            }
          }}
          loading={
            <div className="h-full p-4 space-y-2" style={{ backgroundColor: 'var(--bg-primary)' }}>
              {[60, 85, 45, 72, 90, 55, 40, 68, 80, 50, 63, 75, 82, 38, 65].map((w, i) => (
                <div
                  key={i}
                  className="skeleton h-4 rounded"
                  style={{ width: `${w}%`, marginLeft: i > 0 && i < 11 ? '1.5rem' : undefined }}
                />
              ))}
            </div>
          }
        />
      </div>

      {confirmAction && (
        <ConfirmActionModal
          title={confirmAction === 'reset' ? 'Reset code?' : 'Load last submission?'}
          description={
            confirmAction === 'reset'
              ? 'This will discard your current code and replace it with the starter code. This cannot be undone.'
              : 'This will replace your current code with your most recent submission. Unsaved changes will be lost.'
          }
          confirmLabel={confirmAction === 'reset' ? 'Yes, reset' : 'Yes, load it'}
          onConfirm={() => {
            setConfirmAction(null);
            if (confirmAction === 'reset') {
              performReset();
            } else {
              performGetLastSubmission();
            }
          }}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

function ConfirmActionModal({
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-elevated rounded-2xl border border-primary shadow-xl max-w-sm w-full p-6 animate-slide-up">
        <h3 className="text-base font-bold text-primary mb-1.5">{title}</h3>
        <p className="text-sm text-secondary mb-5">{description}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 text-sm font-medium px-4 py-2.5 rounded-lg border border-primary text-primary hover:bg-tertiary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-lg bg-error text-white hover:opacity-90 transition-opacity"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
