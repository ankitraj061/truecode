'use client';
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { axiosClient } from "@/app/utils/axiosClient";
import { RootState } from "@/app/store/store";

type SubmissionNote = {
  text?: string;
  timeTaken?: number;
};

export type Submission = {
  id: string;
  status: string;
  language: string;
  runtime: number;
  memory: number;
  submittedAt: string;
  notes?: SubmissionNote;
  code?: string; // Only available when fetching a single submission
};

export default function ProblemSubmissionsPage() {
  const { problem } = useSelector((state: RootState) => state.problem);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState("");

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        if (!problem) return;
        const res = await axiosClient.get(`/api/problems/${problem._id}/submissions`);
        setSubmissions(res.data.submissions);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && problem) fetchSubmissions();
  }, [isAuthenticated, problem]);

  const formatMemory = (kb: number) => (kb / 1024).toFixed(2);
  
  const formatTimeTaken = (seconds: number) => {
    if (seconds === 0) return null;
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    // For older dates, show formatted date
    return past.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const handleRowClick = async (id: string) => {
    try {
      const res = await axiosClient.get(`/api/submissions/${id}`);
      setSelectedSubmission(res.data.submission);
    } catch (error) {
    }
  };

  const handleEditNote = (id: string, currentNote: string) => {
    setEditingId(id);
    setNoteValue(currentNote);
  };

  const handleSaveNote = async (id: string) => {
    try {
      await axiosClient.post(`/api/submissions/${id}/notes`, { text: noteValue });
      setSubmissions(prev =>
        prev.map(s => (s.id === id ? { ...s, notes: { ...s.notes, text: noteValue } } : s))
      );
      setEditingId(null);
    } catch (error) {
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'text-success bg-success-light border-success/20';
      case 'wrong answer':
        return 'text-error bg-error-light border-error/20';
      case 'time limit exceeded':
        return 'text-warning bg-warning-light border-warning/20';
      case 'runtime error':
        return 'text-accent bg-accent-light border-accent/20';
      case 'compilation error':
        return 'text-warning bg-warning-light border-warning/20';
      default:
        return 'text-secondary bg-tertiary border-secondary';
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64 animate-fade-in">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
    </div>
  );

  return (
    <div className="p-6 bg-secondary min-h-screen animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-primary bg-elevated">
            <h1 className="text-2xl font-bold text-primary">Problem Submissions</h1>
            <p className="text-secondary mt-1">
              {problem?.title} • {problem?.difficulty && (
                <span className={`capitalize font-medium ${
                  problem.difficulty === 'easy' ? 'text-success' : 
                  problem.difficulty === 'medium' ? 'text-warning' : 'text-error'
                }`}>
                  {problem.difficulty}
                </span>
              )}
            </p>
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-12 animate-fade-in">
              <div className="text-muted text-6xl mb-4">📝</div>
              <p className="text-secondary text-lg">No submissions yet</p>
              <p className="text-muted mt-2">Submit your solution to see it here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary border-b border-primary">
                    <th className="text-left py-4 px-6 font-semibold text-secondary text-sm uppercase tracking-wider w-1/6">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-secondary text-sm uppercase tracking-wider w-1/8">Language</th>
                    <th className="text-left py-4 px-6 font-semibold text-secondary text-sm uppercase tracking-wider w-1/8">Runtime</th>
                    <th className="text-left py-4 px-6 font-semibold text-secondary text-sm uppercase tracking-wider w-1/8">Memory</th>
                    <th className="text-left py-4 px-6 font-semibold text-secondary text-sm uppercase tracking-wider w-1/2">Notes</th>
                    <th className="text-left py-4 px-6 font-semibold text-secondary text-sm uppercase tracking-wider w-1/8">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary">
                  {submissions.map((sub) => {
                    const timeDisplay = formatTimeTaken(sub.notes?.timeTaken || 0);
                    return (
                    <tr
                      key={sub.id}
                      onClick={() => handleRowClick(sub.id)}
                      className="hover:bg-tertiary cursor-pointer transition-all duration-200 interactive"
                    >
                      <td className="py-4 px-6">
                        <div className="space-y-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border shadow-xs ${getStatusColor(sub.status)}`}>
                            {sub.status}
                          </span>
                          {/* Time Display below status */}
                          {timeDisplay && (
                            <div className="flex items-center">
                              <span className="text-xs text-brand bg-elevated px-2 py-1 rounded-full font-medium border border-brand/20 shadow-xs">
                                ⏱️ {timeDisplay}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-primary font-mono text-sm">{sub.language}</td>
                      <td className="py-4 px-6 text-primary font-medium">{sub.runtime} ms</td>
                      <td className="py-4 px-6 text-primary">{formatMemory(sub.memory)} MB</td>

                      {/* Notes Cell - Now wider */}
                      <td 
                        className="py-4 px-6"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {editingId === sub.id ? (
                          <div className="flex gap-2 items-center">
                            <input
                              className="input text-sm w-full"
                              value={noteValue}
                              onChange={(e) => setNoteValue(e.target.value)}
                              placeholder="Add a note..."
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleSaveNote(sub.id)}
                                className="text-success hover:bg-success-light p-1 rounded-lg transition-all duration-200 interactive"
                                title="Save note"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-muted hover:bg-tertiary p-1 rounded-lg transition-all duration-200 interactive"
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="group cursor-text w-full interactive"
                            onClick={() => handleEditNote(sub.id, sub.notes?.text || "")}
                          >
                            {/* Note Text */}
                            <div className="min-h-8 w-full">
                              {sub.notes?.text ? (
                                <div className="text-primary text-sm bg-tertiary rounded-lg p-3 border border-primary group-hover:bg-secondary transition-all duration-200 w-full shadow-xs">
                                  {sub.notes.text}
                                </div>
                              ) : (
                                <div className="text-muted text-sm italic group-hover:text-secondary transition-colors duration-200">
                                  Click to add note...
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-6 text-tertiary text-sm">
                        {getRelativeTime(sub.submittedAt)}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Submission Details Modal */}
      {selectedSubmission && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-modal backdrop-blur-sm z-50 p-4 animate-fade-in"
          onClick={() => setSelectedSubmission(null)}
        >
          <div
            className="bg-elevated rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-primary animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-primary bg-elevated flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-primary">Submission Details</h2>
                <p className="text-secondary text-sm mt-1">ID: {selectedSubmission.id}</p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-muted hover:text-primary text-2xl p-1 interactive rounded-lg"
              >
                ×
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-tertiary rounded-lg p-4 shadow-xs">
                  <p className="text-sm text-secondary">Status</p>
                  <p className={`font-semibold capitalize ${getStatusColor(selectedSubmission.status).split(' ')[0]}`}>
                    {selectedSubmission.status}
                  </p>
                </div>
                <div className="bg-tertiary rounded-lg p-4 shadow-xs">
                  <p className="text-sm text-secondary">Language</p>
                  <p className="font-semibold text-primary">{selectedSubmission.language}</p>
                </div>
                <div className="bg-tertiary rounded-lg p-4 shadow-xs">
                  <p className="text-sm text-secondary">Runtime</p>
                  <p className="font-semibold text-primary">{selectedSubmission.runtime} ms</p>
                </div>
                <div className="bg-tertiary rounded-lg p-4 shadow-xs">
                  <p className="text-sm text-secondary">Memory</p>
                  <p className="font-semibold text-primary">{formatMemory(selectedSubmission.memory)} MB</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-3">Code</h3>
                <pre className="bg-elevated text-primary p-4 rounded-lg overflow-auto text-sm leading-relaxed shadow-sm border border-primary">
                  {selectedSubmission.code}
                </pre>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-primary bg-secondary flex justify-end">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
