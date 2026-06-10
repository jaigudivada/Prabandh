import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { AlertCircle, Upload, X } from 'lucide-react';
import Select from '../components/Select';
import DatePicker from '../components/DatePicker';
import TimePicker from '../components/TimePicker';

export default function IssueForm() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    priority: 'MEDIUM',
    preferredDate: '',
    preferredTime: '',
    isAnonymous: false,
    tags: [],
  });
  const [categorySearch, setCategorySearch] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/api/categories').then(setCategories).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const newFiles = [...files, ...selected].slice(0, 5);
    setFiles(newFiles);
    const newPreviews = selected.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews].slice(0, 5));
  };

  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(event.type === 'dragover');
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
    const droppedFiles = Array.from(event.dataTransfer.files);
    const selected = droppedFiles.filter((file) => file.type.startsWith('image/'));
    const newFiles = [...files, ...selected].slice(0, 5);
    setFiles(newFiles);
    const newPreviews = selected.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews].slice(0, 5));
  };

  const handleTagKeyDown = (event) => {
    const value = tagInput.trim();
    if ((event.key === 'Enter' || event.key === ',') && value) {
      event.preventDefault();
      if (!form.tags.includes(value)) {
        setForm((prev) => ({ ...prev, tags: [...prev.tags, value] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((item) => item !== tag),
    }));
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
    c.value.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const progress = Math.min(
    100,
    Math.round(
      ((form.title ? 1 : 0) +
        (form.category ? 1 : 0) +
        (form.location ? 1 : 0) +
        (form.description ? 1 : 0) +
        (form.tags.length ? 1 : 0) +
        (files.length ? 1 : 0)) /
        6 *
        100
    )
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.category) { setError('Please select a category'); return; }
    setLoading(true);

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        data.append(key, JSON.stringify(value));
      } else {
        data.append(key, value);
      }
    });
    files.forEach((f) => data.append('attachments', f));

    try {
      await api.post('/api/issues', data);
      setSuccess('Issue submitted successfully!');
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError(err.message || 'Failed to submit issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="page-title">Report an Issue</h1>
        <p className="page-subtitle">Describe the problem with as much detail as possible.</p>
      </div>

      <div className="card">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-primary-700 dark:text-primary-400">Form progress</p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">Issue report details</h2>
              </div>
              <span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {progress}% complete
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-full rounded-full bg-primary-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="title" className="form-label">Title</label>
              <input
                id="title"
                name="title"
                required
                maxLength={120}
                value={form.title}
                onChange={handleChange}
                className="input-field"
                placeholder="Short summary of the issue"
              />
              <p className="input-help">{form.title.length}/120 characters</p>
            </div>
            <div>
              <label htmlFor="location" className="form-label">Location</label>
              <input
                id="location"
                name="location"
                required
                value={form.location}
                onChange={handleChange}
                className="input-field"
                placeholder="Building, floor, room number"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <Select
                id="category"
                label="Category"
                value={form.category}
                onChange={(value) => setForm({ ...form, category: value })}
                options={categories.map((c) => ({ value: c.value, label: c.name }))}
                placeholder="Select a category"
                searchable
                required
                error={false}
              />
            </div>

            <div>
              <Select
                id="priority"
                label="Priority"
                value={form.priority}
                onChange={(value) => setForm({ ...form, priority: value })}
                options={[
                  { value: 'LOW', label: 'Low' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'HIGH', label: 'High' },
                ]}
                placeholder="Select priority"
              />
            </div>

            <div className="grid gap-5">
              <DatePicker
                id="preferredDate"
                label="Preferred date"
                value={form.preferredDate}
                onChange={(value) => setForm({ ...form, preferredDate: value })}
              />
              <TimePicker
                id="preferredTime"
                label="Preferred time"
                value={form.preferredTime}
                onChange={(value) => setForm({ ...form, preferredTime: value })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              name="description"
              required
              rows={6}
              maxLength={800}
              value={form.description}
              onChange={handleChange}
              className="input-field resize-none min-h-[180px]"
              placeholder="Provide a detailed description of the issue..."
            />
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Clear, structured detail helps faster resolution.</span>
              <span>{form.description.length}/800</span>
            </div>
          </div>

          <div>
            <label className="form-label">Tags</label>
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <span key={tag} className="tag-pill">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="tag-remove" aria-label={`Remove ${tag}`}>
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Add tag and press Enter"
              className="input-field mt-3"
            />
            <p className="input-help">Press Enter to add tags like "electrical", "leak", or "access".</p>
          </div>

          <div>
            <label className="form-label">Attachments (up to 5 photos)</label>
            <div
              className={`upload-zone ${isDragActive ? 'upload-zone-active' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <Upload className="h-5 w-5" />
                <div className="space-y-1 text-center">
                  <p className="font-medium text-slate-900 dark:text-slate-100">Drag & drop photos here</p>
                  <p className="text-xs">Or click to browse. PNG, JPG, GIF up to 10MB.</p>
                </div>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
            {previews.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shadow-sm">
                    <img src={src} alt={`Preview ${i + 1}`} className="h-28 w-full object-cover" />
                    <button type="button" onClick={() => removeFile(i)} className="absolute right-2 top-2 rounded-full bg-slate-950/70 p-2 text-white transition hover:bg-slate-950">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-[20px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <input id="anonymous" name="isAnonymous" type="checkbox" checked={form.isAnonymous} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500" />
              <label htmlFor="anonymous" className="text-sm font-medium text-slate-900 dark:text-slate-100">Report anonymously</label>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Your identity will be hidden from Supervisors and Officials.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Submitting...' : 'Publish Issue'}</button>
            <button type="button" onClick={() => navigate('/')} className="btn-secondary w-full sm:w-auto">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
