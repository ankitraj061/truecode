'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useContestProblem } from '../ContestProblemContext';
import { axiosClient } from '@/app/utils/axiosClient';
import type { Monaco } from '@monaco-editor/react';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
];

const DEFAULT_CODE: Record<string, string> = {
  javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};`,
  python: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass`,
  java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}`,
  cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};`,
  c: `int* twoSum(int* nums, int numsSize, int target, int* returnSize){\n    \n}`,
};

export default function ContestCodeEditorSection() {
  const { data } = useContestProblem();
  const problem = data?.problem;
  const userStatus = data?.userStatus;

  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const getStartCodeForLanguage = useCallback((language: string): string => {
    const startCode = problem?.startCode as { language: string; initialCode: string }[] | undefined;
    if (startCode?.length) {
      const entry = startCode.find((e) => e.language === language);
      if (entry?.initialCode) return entry.initialCode;
    }
    return DEFAULT_CODE[language] || '';
  }, [problem?.startCode]);

  useEffect(() => {
    window.codeEditorData = { code, language: selectedLanguage };
  }, [code, selectedLanguage]);

  useEffect(() => {
    if (!problem) return;
    const pref = userStatus?.preferredLanguage || 'javascript';
    const lang = LANGUAGES.some((l) => l.value === pref) ? pref : 'javascript';
    setSelectedLanguage(lang);
    setCode(getStartCodeForLanguage(lang));
  }, [problem, userStatus?.preferredLanguage, getStartCodeForLanguage]);

  const handleCodeChange = (value: string | undefined) => setCode(value ?? '');

  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    const newCode = getStartCodeForLanguage(newLanguage);
    setCode(newCode);
    editorRef.current?.setValue(newCode);
  };

  const zoomIn = () => setFontSize((f) => Math.min(f + 2, 28));
  const zoomOut = () => setFontSize((f) => Math.max(f - 2, 10));

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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleReset = () => {
    setIsResetting(true);
    const defaultCode = getStartCodeForLanguage(selectedLanguage);
    setCode(defaultCode);
    editorRef.current?.setValue(defaultCode);
    setTimeout(() => setIsResetting(false), 300);
  };

  const handleFormat = async () => {
    if (!editorRef.current || !code.trim()) return;
    setIsFormatting(true);
    try {
      const res = await axiosClient.post('/api/format', { code, language: selectedLanguage });
      if (res.data?.success && res.data.formattedCode) {
        setCode(res.data.formattedCode);
        editorRef.current.setValue(res.data.formattedCode);
      }
    } catch {
      try {
        await editorRef.current.getAction('editor.action.formatDocument')?.run();
      } catch {
        // ignore
      }
    } finally {
      setIsFormatting(false);
    }
  };

  const defineCustomThemes = (monaco: Monaco) => {
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: { 'editor.background': '#0D1117', 'editor.foreground': '#E6EDF3' },
    });
    monaco.editor.defineTheme('custom-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: { 'editor.background': '#FEFEFE', 'editor.foreground': '#24292F' },
    });
  };

  const handleEditorDidMount = (ed: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = ed;
    monacoRef.current = monaco;
    defineCustomThemes(monaco);
    monaco.editor.setTheme(theme === 'dark' ? 'custom-dark' : 'custom-light');
    ed.addAction({
      id: 'format-code',
      label: 'Format Code',
      run: () => handleFormat(),
    });
  };

  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(theme === 'dark' ? 'custom-dark' : 'custom-light');
    }
  }, [theme]);

  if (!problem) {
    return (
      <div className="h-full flex items-center justify-center bg-secondary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
        <span className="ml-3 text-secondary">Loading editor...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-primary">
      <div className="flex items-center justify-between bg-elevated border-b border-primary px-4 py-3">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-semibold text-primary">Code Editor</span>
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="input text-sm px-4 py-2 min-w-32 font-mono bg-elevated border-primary"
            disabled={isResetting}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          <div className="flex items-center bg-elevated border border-primary rounded-lg overflow-hidden">
            <button type="button" onClick={zoomOut} disabled={fontSize <= 10} className="interactive text-secondary hover:text-primary px-3 py-2 disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
            </button>
            <span className="text-xs text-secondary px-3 py-2 border-x border-primary min-w-12 text-center">{fontSize}px</span>
            <button type="button" onClick={zoomIn} disabled={fontSize >= 28} className="interactive text-secondary hover:text-primary px-3 py-2 disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
          <button type="button" onClick={toggleFullscreen} className="interactive bg-elevated hover:bg-tertiary text-secondary hover:text-primary px-3 py-2 rounded-lg border border-primary" title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M15 15h4.5M15 15v4.5" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            )}
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button type="button" onClick={handleReset} disabled={isResetting} className="interactive bg-elevated hover:bg-tertiary text-secondary hover:text-primary px-3 py-2 rounded-lg border border-primary disabled:opacity-50" title="Reset code">
            {isResetting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
          </button>
          <button type="button" onClick={handleFormat} disabled={isFormatting || !code.trim()} className="interactive bg-elevated hover:bg-tertiary text-secondary hover:text-primary px-3 py-2 rounded-lg border border-primary disabled:opacity-50" title="Format (Alt+Shift+F)">
            {isFormatting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 relative">
        <Editor
          height="100%"
          language={selectedLanguage}
          value={code}
          theme={theme === 'dark' ? 'custom-dark' : 'custom-light'}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, Menlo, monospace",
            minimap: { enabled: fontSize < 16 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            tabSize: 2,
            insertSpaces: true,
            folding: true,
            matchBrackets: 'always',
            smoothScrolling: true,
            mouseWheelZoom: true,
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-elevated">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-tertiary border-t-brand" />
              <span className="ml-3 text-secondary">Loading editor...</span>
            </div>
          }
        />
      </div>
    </div>
  );
}
