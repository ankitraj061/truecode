'use client';

import React, { useEffect, useState } from 'react';
import { AdminAPI } from './utils/adminAPI';
import type { AdminProblem } from './utils/adminAPI';

const LANGUAGES = [
  { value: 'cpp', label: 'C++' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'c', label: 'C' },
];

type VisibleTestCase = { input: string; output: string; explanation?: string; imageUrl?: string };
type HiddenTestCase = { input: string; output: string };
type StartCodeEntry = { language: string; initialCode: string };
type ReferenceSolutionEntry = {
  language: string;
  completeCode: string;
  timeComplexity?: string;
  spaceComplexity?: string;
};

interface ProblemFormProps {
  editProblem: AdminProblem | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProblemForm({ editProblem, onSuccess, onCancel }: ProblemFormProps) {
  const isEdit = !!editProblem?._id;

  const [title, setTitle] = useState(editProblem?.title ?? '');
  const [description, setDescription] = useState(editProblem?.description ?? '');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    (editProblem?.difficulty as 'easy' | 'medium' | 'hard') ?? 'easy'
  );
  const [tagsStr, setTagsStr] = useState('');
  const [constraintsStr, setConstraintsStr] = useState('');
  const [companiesStr, setCompaniesStr] = useState('');
  const [visibleTestCases, setVisibleTestCases] = useState<VisibleTestCase[]>([
    { input: '', output: '' },
  ]);
  const [hiddenTestCases, setHiddenTestCases] = useState<HiddenTestCase[]>([]);
  const [startCode, setStartCode] = useState<StartCodeEntry[]>([
    { language: 'cpp', initialCode: '' },
  ]);
  const [referenceSolutions, setReferenceSolutions] = useState<ReferenceSolutionEntry[]>([]);
  const [hintsStr, setHintsStr] = useState('');
  const [editorialText, setEditorialText] = useState('');
  const [editorialVideoUrl, setEditorialVideoUrl] = useState('');
  const [editorialThumbnailUrl, setEditorialThumbnailUrl] = useState('');
  const [editorialVideoDuration, setEditorialVideoDuration] = useState('');
  const [isActive, setIsActive] = useState(editProblem?.isActive ?? true);
  const [isPremium, setIsPremium] = useState(editProblem?.isPremium ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When editing, fetch full problem details so all fields are prefilled
  useEffect(() => {
    if (!isEdit || !editProblem?._id) return;

    let cancelled = false;

    const loadDetails = async () => {
      try {
        const full = await AdminAPI.getProblemById(editProblem._id);
        if (cancelled) return;

        setTitle(full.title ?? '');
        setDescription(full.description ?? '');
        setDifficulty((full.difficulty as 'easy' | 'medium' | 'hard') ?? 'easy');
        setTagsStr((full.tags || []).join(', '));
        setConstraintsStr((full.constraints || []).join('\n'));
        setCompaniesStr((full.companies || []).join(', '));

        if (Array.isArray(full.visibleTestCases) && full.visibleTestCases.length > 0) {
          setVisibleTestCases(full.visibleTestCases);
        }

        if (Array.isArray(full.hiddenTestCases) && full.hiddenTestCases.length > 0) {
          setHiddenTestCases(full.hiddenTestCases);
        }

        if (Array.isArray(full.startCode) && full.startCode.length > 0) {
          setStartCode(full.startCode);
        }

        if (Array.isArray(full.referenceSolution) && full.referenceSolution.length > 0) {
          setReferenceSolutions(full.referenceSolution);
        }

        setHintsStr((full.hints || []).join('\n'));

        const editorial = full.editorialContent || {};
        setEditorialText(editorial.textContent ?? '');
        setEditorialVideoUrl(editorial.videoUrl ?? '');
        setEditorialThumbnailUrl(editorial.thumbnailUrl ?? '');
        setEditorialVideoDuration(
          editorial.videoDuration != null ? String(editorial.videoDuration) : '',
        );
        setIsActive(full.isActive);
        setIsPremium(full.isPremium);
      } catch (err) {
        const msg =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          (err as Error)?.message ??
          'Failed to load problem details';
        setError(msg);
      }
    };

    void loadDetails();

    return () => {
      cancelled = true;
    };
  }, [isEdit, editProblem?._id]);

  const parseList = (s: string) =>
    s
      .split(/[\n,]/)
      .map((x) => x.trim())
      .filter(Boolean);

  const buildPayload = () => {
    const tags = parseList(tagsStr);
    const constraints = parseList(constraintsStr);
    const companies = parseList(companiesStr);
    const visible = visibleTestCases
      .map((tc) => ({
        input: tc.input.trim(),
        output: tc.output.trim(),
        ...(tc.explanation?.trim() && { explanation: tc.explanation.trim() }),
        ...(tc.imageUrl?.trim() && { imageUrl: tc.imageUrl.trim() }),
      }))
      .filter((tc) => tc.input && tc.output);
    const hidden = hiddenTestCases
      .map((tc) => ({ input: tc.input.trim(), output: tc.output.trim() }))
      .filter((tc) => tc.input && tc.output);
    const startCodeFiltered = startCode
      .map((sc) => ({ language: sc.language, initialCode: sc.initialCode.trim() }))
      .filter((sc) => sc.initialCode);
    const refFiltered = referenceSolutions
      .map((r) => ({
        language: r.language,
        completeCode: r.completeCode.trim(),
        ...(r.timeComplexity?.trim() && { timeComplexity: r.timeComplexity.trim() }),
        ...(r.spaceComplexity?.trim() && { spaceComplexity: r.spaceComplexity.trim() }),
      }))
      .filter((r) => r.completeCode);
    const hints = parseList(hintsStr);

    const editorial =
      editorialText.trim() ||
      editorialVideoUrl.trim() ||
      editorialThumbnailUrl.trim() ||
      editorialVideoDuration.trim()
        ? {
            textContent: editorialText.trim() || undefined,
            videoUrl: editorialVideoUrl.trim() || undefined,
            thumbnailUrl: editorialThumbnailUrl.trim() || undefined,
            videoDuration: editorialVideoDuration.trim() ? Number(editorialVideoDuration) : undefined,
          }
        : undefined;

    if (isEdit) {
      const update: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        difficulty,
        isActive,
        isPremium,
      };
      if (tags.length) update.tags = tags;
      if (constraints.length) update.constraints = constraints;
      if (companies.length) update.companies = companies;
      if (visible.length) update.visibleTestCases = visible;
      if (hidden.length) update.hiddenTestCases = hidden;
      if (startCodeFiltered.length) update.startCode = startCodeFiltered;
      if (refFiltered.length) update.referenceSolution = refFiltered;
      if (hints.length) update.hints = hints;
      if (editorial) update.editorialContent = editorial;
      return update;
    }

    return {
      title: title.trim(),
      description: description.trim(),
      difficulty,
      tags,
      constraints,
      companies: companies.length ? companies : undefined,
      visibleTestCases: visible,
      hiddenTestCases: hidden.length ? hidden : undefined,
      startCode: startCodeFiltered,
      referenceSolution: refFiltered.length ? refFiltered : undefined,
      hints: hints.length ? hints : undefined,
      editorialContent: editorial,
      isActive,
      isPremium,
    };
  };

  const validate = (): string | null => {
    if (!title.trim()) return 'Title is required.';
    if (title.length < 5) return 'Title must be at least 5 characters.';
    if (!description.trim()) return 'Description is required.';
    if (description.length < 20) return 'Description must be at least 20 characters.';
    if (!isEdit) {
      const tags = parseList(tagsStr);
      if (tags.length === 0) return 'At least one tag is required.';
      const constraints = parseList(constraintsStr);
      if (constraints.length === 0) return 'At least one constraint is required.';
      const visible = visibleTestCases.filter((tc) => tc.input.trim() && tc.output.trim());
      if (visible.length === 0) return 'At least one visible test case is required.';
      const startCodeFiltered = startCode.filter((sc) => sc.initialCode.trim());
      if (startCodeFiltered.length === 0) return 'At least one starter code entry is required.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    const payload = buildPayload();
    setLoading(true);
    try {
      if (isEdit && editProblem?._id) {
        await AdminAPI.updateProblem(editProblem._id, payload as Parameters<typeof AdminAPI.updateProblem>[1]);
      } else {
        await AdminAPI.createProblem(payload as Parameters<typeof AdminAPI.createProblem>[0]);
      }
      onSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as Error)?.message ??
        'Request failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const addVisible = () => setVisibleTestCases((p) => [...p, { input: '', output: '' }]);
  const removeVisible = (i: number) =>
    setVisibleTestCases((p) => (p.length <= 1 ? p : p.filter((_, idx) => idx !== i)));
  const addHidden = () => setHiddenTestCases((p) => [...p, { input: '', output: '' }]);
  const removeHidden = (i: number) => setHiddenTestCases((p) => p.filter((_, idx) => idx !== i));
  const addStartCode = () => setStartCode((p) => [...p, { language: 'cpp', initialCode: '' }]);
  const removeStartCode = (i: number) =>
    setStartCode((p) => (p.length <= 1 ? p : p.filter((_, idx) => idx !== i)));
  const addReference = () =>
    setReferenceSolutions((p) => [...p, { language: 'cpp', completeCode: '' }]);
  const removeReference = (i: number) =>
    setReferenceSolutions((p) => p.filter((_, idx) => idx !== i));

  const sectionClass = 'bg-elevated border border-border-primary rounded-xl p-5 space-y-4';
  const labelClass = 'block text-sm font-medium text-primary mb-1';
  const inputClass = 'input w-full';
  const optionalBadge = (
    <span className="ml-1.5 text-xs font-normal text-tertiary">(optional)</span>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic info */}
      <div className={sectionClass}>
        <h3 className="text-lg font-semibold text-primary border-b border-border-primary pb-2">
          Basic information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>
              Title <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="e.g. Two Sum"
              minLength={5}
              maxLength={100}
              required
            />
            <p className="text-xs text-tertiary mt-0.5">5–100 characters</p>
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>
              Description <span className="text-error">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} min-h-[140px]`}
              placeholder="Problem statement, examples, notes..."
              minLength={20}
              required
            />
            <p className="text-xs text-tertiary mt-0.5">At least 20 characters</p>
          </div>
          <div>
            <label className={labelClass}>
              Difficulty <span className="text-error">*</span>
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              className={inputClass}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div />
          <div>
            <label className={labelClass}>
              Tags <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              className={inputClass}
              placeholder="array, hash table, two pointers (comma or newline)"
            />
            <p className="text-xs text-tertiary mt-0.5">At least one tag</p>
          </div>
          <div>
            <label className={labelClass}>Companies {optionalBadge}</label>
            <input
              type="text"
              value={companiesStr}
              onChange={(e) => setCompaniesStr(e.target.value)}
              className={inputClass}
              placeholder="Google, Amazon (comma or newline)"
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>
              Constraints <span className="text-error">*</span>
            </label>
            <textarea
              value={constraintsStr}
              onChange={(e) => setConstraintsStr(e.target.value)}
              className={`${inputClass} min-h-[80px]`}
              placeholder="One per line: Time limit, Memory limit, etc."
              required
            />
            <p className="text-xs text-tertiary mt-0.5">At least one constraint</p>
          </div>
        </div>
      </div>

      {/* Visible test cases */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between border-b border-border-primary pb-2">
          <h3 className="text-lg font-semibold text-primary">
            Visible test cases <span className="text-error">*</span>
          </h3>
          <button type="button" onClick={addVisible} className="btn-secondary text-sm py-1.5 px-3">
            + Add case
          </button>
        </div>
        <p className="text-xs text-secondary">At least one; shown to users when they run code.</p>
        <div className="space-y-4">
          {visibleTestCases.map((tc, idx) => (
            <div key={idx} className="border border-border-primary rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-secondary">Case {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removeVisible(idx)}
                  disabled={visibleTestCases.length <= 1}
                  className="text-xs text-error hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
              <div>
                <label className="text-xs text-secondary">Input *</label>
                <textarea
                  value={tc.input}
                  onChange={(e) => {
                    const n = [...visibleTestCases];
                    n[idx] = { ...n[idx], input: e.target.value };
                    setVisibleTestCases(n);
                  }}
                  className={`${inputClass} min-h-[60px] font-mono text-sm`}
                  placeholder="Test input"
                />
              </div>
              <div>
                <label className="text-xs text-secondary">Expected output *</label>
                <textarea
                  value={tc.output}
                  onChange={(e) => {
                    const n = [...visibleTestCases];
                    n[idx] = { ...n[idx], output: e.target.value };
                    setVisibleTestCases(n);
                  }}
                  className={`${inputClass} min-h-[60px] font-mono text-sm`}
                  placeholder="Expected output"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary">Explanation {optionalBadge}</label>
                  <input
                    type="text"
                    value={tc.explanation ?? ''}
                    onChange={(e) => {
                      const n = [...visibleTestCases];
                      n[idx] = { ...n[idx], explanation: e.target.value };
                      setVisibleTestCases(n);
                    }}
                    className={inputClass}
                    placeholder="Short explanation"
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary">Image URL {optionalBadge}</label>
                  <input
                    type="text"
                    value={tc.imageUrl ?? ''}
                    onChange={(e) => {
                      const n = [...visibleTestCases];
                      n[idx] = { ...n[idx], imageUrl: e.target.value };
                      setVisibleTestCases(n);
                    }}
                    className={inputClass}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden test cases */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between border-b border-border-primary pb-2">
          <h3 className="text-lg font-semibold text-primary">Hidden test cases {optionalBadge}</h3>
          <button type="button" onClick={addHidden} className="btn-secondary text-sm py-1.5 px-3">
            + Add case
          </button>
        </div>
        <p className="text-xs text-secondary">Used for submission grading; not shown to users.</p>
        {hiddenTestCases.length === 0 ? (
          <p className="text-sm text-tertiary">No hidden cases added.</p>
        ) : (
          <div className="space-y-4">
            {hiddenTestCases.map((tc, idx) => (
              <div key={idx} className="border border-border-primary rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-secondary">Hidden case {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeHidden(idx)}
                    className="text-xs text-error hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <div>
                  <label className="text-xs text-secondary">Input *</label>
                  <textarea
                    value={tc.input}
                    onChange={(e) => {
                      const n = [...hiddenTestCases];
                      n[idx] = { ...n[idx], input: e.target.value };
                      setHiddenTestCases(n);
                    }}
                    className={`${inputClass} min-h-[50px] font-mono text-sm`}
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary">Expected output *</label>
                  <textarea
                    value={tc.output}
                    onChange={(e) => {
                      const n = [...hiddenTestCases];
                      n[idx] = { ...n[idx], output: e.target.value };
                      setHiddenTestCases(n);
                    }}
                    className={`${inputClass} min-h-[50px] font-mono text-sm`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Starter code */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between border-b border-border-primary pb-2">
          <h3 className="text-lg font-semibold text-primary">
            Starter code <span className="text-error">*</span>
          </h3>
          <button type="button" onClick={addStartCode} className="btn-secondary text-sm py-1.5 px-3">
            + Add language
          </button>
        </div>
        <p className="text-xs text-secondary">At least one language; shown in the editor.</p>
        <div className="space-y-4">
          {startCode.map((sc, idx) => (
            <div key={idx} className="border border-border-primary rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <select
                  value={sc.language}
                  onChange={(e) => {
                    const n = [...startCode];
                    n[idx] = { ...n[idx], language: e.target.value };
                    setStartCode(n);
                  }}
                  className="input w-40"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeStartCode(idx)}
                  disabled={startCode.length <= 1}
                  className="text-xs text-error hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
              <textarea
                value={sc.initialCode}
                onChange={(e) => {
                  const n = [...startCode];
                  n[idx] = { ...n[idx], initialCode: e.target.value };
                  setStartCode(n);
                }}
                className={`${inputClass} min-h-[100px] font-mono text-sm`}
                placeholder="// Starter code for this language"
                required
              />
            </div>
          ))}
        </div>
      </div>

      {/* Reference solutions */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between border-b border-border-primary pb-2">
          <h3 className="text-lg font-semibold text-primary">Reference solutions {optionalBadge}</h3>
          <button type="button" onClick={addReference} className="btn-secondary text-sm py-1.5 px-3">
            + Add solution
          </button>
        </div>
        <p className="text-xs text-secondary">
          Optional. If provided, they are validated against visible test cases on create/update.
        </p>
        {referenceSolutions.length === 0 ? (
          <p className="text-sm text-tertiary">No reference solutions added.</p>
        ) : (
          <div className="space-y-4">
            {referenceSolutions.map((r, idx) => (
              <div key={idx} className="border border-border-primary rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <select
                    value={r.language}
                    onChange={(e) => {
                      const n = [...referenceSolutions];
                      n[idx] = { ...n[idx], language: e.target.value };
                      setReferenceSolutions(n);
                    }}
                    className="input w-40"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeReference(idx)}
                    className="text-xs text-error hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  value={r.completeCode}
                  onChange={(e) => {
                    const n = [...referenceSolutions];
                    n[idx] = { ...n[idx], completeCode: e.target.value };
                    setReferenceSolutions(n);
                  }}
                  className={`${inputClass} min-h-[120px] font-mono text-sm`}
                  placeholder="Complete correct solution"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-secondary">Time complexity {optionalBadge}</label>
                    <input
                      type="text"
                      value={r.timeComplexity ?? ''}
                      onChange={(e) => {
                        const n = [...referenceSolutions];
                        n[idx] = { ...n[idx], timeComplexity: e.target.value };
                        setReferenceSolutions(n);
                      }}
                      className={inputClass}
                      placeholder="e.g. O(n)"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-secondary">Space complexity {optionalBadge}</label>
                    <input
                      type="text"
                      value={r.spaceComplexity ?? ''}
                      onChange={(e) => {
                        const n = [...referenceSolutions];
                        n[idx] = { ...n[idx], spaceComplexity: e.target.value };
                        setReferenceSolutions(n);
                      }}
                      className={inputClass}
                      placeholder="e.g. O(1)"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hints & Editorial */}
      <div className={sectionClass}>
        <h3 className="text-lg font-semibold text-primary border-b border-border-primary pb-2">
          Hints & editorial {optionalBadge}
        </h3>
        <div>
          <label className={labelClass}>Hints (one per line or comma-separated)</label>
          <textarea
            value={hintsStr}
            onChange={(e) => setHintsStr(e.target.value)}
            className={`${inputClass} min-h-[60px]`}
            placeholder="Hint 1&#10;Hint 2"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>Editorial text</label>
            <textarea
              value={editorialText}
              onChange={(e) => setEditorialText(e.target.value)}
              className={`${inputClass} min-h-[100px]`}
              placeholder="Solution explanation / article"
            />
          </div>
          <div>
            <label className={labelClass}>Editorial video URL</label>
            <input
              type="text"
              value={editorialVideoUrl}
              onChange={(e) => setEditorialVideoUrl(e.target.value)}
              className={inputClass}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className={labelClass}>Thumbnail URL</label>
            <input
              type="text"
              value={editorialThumbnailUrl}
              onChange={(e) => setEditorialThumbnailUrl(e.target.value)}
              className={inputClass}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className={labelClass}>Video duration (seconds)</label>
            <input
              type="number"
              min={0}
              value={editorialVideoDuration}
              onChange={(e) => setEditorialVideoDuration(e.target.value)}
              className={inputClass}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Visibility */}
      <div className={sectionClass}>
        <h3 className="text-lg font-semibold text-primary border-b border-border-primary pb-2">
          Visibility & access
        </h3>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-border-primary text-brand focus:ring-brand"
            />
            <span className="text-sm font-medium text-primary">Active (visible to users)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
              className="h-4 w-4 rounded border-border-primary text-brand focus:ring-brand"
            />
            <span className="text-sm font-medium text-primary">Premium only</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error/10 border border-error text-error text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-secondary px-4 py-2">
          Cancel
        </button>
        <button type="submit" className="btn-primary px-4 py-2" disabled={loading}>
          {loading ? (isEdit ? 'Saving...' : 'Creating...') : isEdit ? 'Save changes' : 'Create problem'}
        </button>
      </div>
    </form>
  );
}
