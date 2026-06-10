import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Download, Trash2 } from 'lucide-react';

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [], errors: ['File must have a header row and at least one data row'] };
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  const errors = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    if (vals.length !== headers.length) {
      errors.push(`Row ${i + 1}: column count mismatch (expected ${headers.length}, got ${vals.length})`);
      continue;
    }
    const row = {};
    headers.forEach((h, idx) => { row[h] = vals[idx]; });
    row._rowIndex = i + 1;
    row._valid = true;
    row._errors = [];
    rows.push(row);
  }
  return { headers, rows, errors };
}

function validateRow(row, requiredFields) {
  const errors = [];
  requiredFields.forEach((f) => {
    if (!row[f] || row[f].trim() === '') errors.push(`${f} is required`);
  });
  if (row.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.Email)) errors.push('Invalid email format');
  if (row.Phone && !/^[\d+\-() ]{7,15}$/.test(row.Phone)) errors.push('Invalid phone format');
  return errors;
}

export default function CsvUploader({ onImport, requiredFields = [], templateHeaders = [], templateName = 'template.csv' }) {
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!f.name.endsWith('.csv')) {
      setParsed({ errors: ['Only .csv files are supported'] });
      return;
    }
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = parseCSV(e.target.result);
      if (data.rows.length > 0) {
        data.rows.forEach((row) => {
          const errs = validateRow(row, requiredFields);
          if (errs.length > 0) { row._valid = false; row._errors = errs; }
        });
      }
      setParsed(data);
    };
    reader.readAsText(f);
  }, [requiredFields]);

  const removeRow = (idx) => {
    setParsed((prev) => {
      const rows = [...prev.rows];
      rows.splice(idx, 1);
      return { ...prev, rows };
    });
  };

  const updateCell = (rowIdx, header, value) => {
    setParsed((prev) => {
      const rows = [...prev.rows];
      rows[rowIdx] = { ...rows[rowIdx], [header]: value };
      const errs = validateRow(rows[rowIdx], requiredFields);
      rows[rowIdx]._valid = errs.length === 0;
      rows[rowIdx]._errors = errs;
      return { ...prev, rows };
    });
  };

  const handleImport = async () => {
    const validRows = parsed.rows.filter((r) => r._valid);
    if (validRows.length === 0) return;
    setImporting(true);
    try {
      await onImport(validRows.map((r) => {
        const clean = { ...r };
        delete clean._rowIndex;
        delete clean._valid;
        delete clean._errors;
        return clean;
      }));
      setResult({ success: true, count: validRows.length });
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = templateHeaders.join(',') + '\n' + templateHeaders.map(() => '').join(',');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = templateName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setParsed(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const validCount = parsed?.rows?.filter((r) => r._valid).length || 0;
  const invalidCount = parsed?.rows?.filter((r) => !r._valid).length || 0;

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors ${dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-primary-300'}`}
      >
        <Upload className="h-8 w-8 text-gray-400" />
        <p className="text-sm text-gray-600">Drag & drop CSV file here</p>
        <button type="button" onClick={() => inputRef.current?.click()} className="btn-secondary text-xs mt-1">Browse Files</button>
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
      </div>

      {templateHeaders.length > 0 && (
        <button type="button" onClick={downloadTemplate} className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium">
          <Download className="h-3.5 w-3.5" />Download CSV Template
        </button>
      )}

      {file && (
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
          <FileText className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
          <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
          <button onClick={reset} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>
      )}

      {parsed?.errors?.length > 0 && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          {parsed.errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
        </div>
      )}

      {parsed?.rows?.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="h-3.5 w-3.5" />{validCount} valid</span>
            {invalidCount > 0 && <span className="flex items-center gap-1 text-red-600"><AlertCircle className="h-3.5 w-3.5" />{invalidCount} invalid</span>}
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {parsed.headers.map((h) => <th key={h} className="px-2 py-2 text-left font-medium text-gray-600">{h}</th>)}
                  <th className="px-2 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parsed.rows.map((row, idx) => (
                  <tr key={idx} className={row._valid ? '' : 'bg-red-50/50'}>
                    {parsed.headers.map((h) => (
                      <td key={h} className="px-2 py-1.5">
                        <input
                          type="text"
                          value={row[h] || ''}
                          onChange={(e) => updateCell(idx, h, e.target.value)}
                          className={`w-full rounded border px-1.5 py-0.5 text-xs ${row._errors.some((e) => e.includes(h)) ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                        />
                      </td>
                    ))}
                    <td className="px-2 py-1.5">
                      <button onClick={() => removeRow(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsed.rows.some((r) => !r._valid) && (
            <div className="space-y-1">
              {parsed.rows.filter((r) => !r._valid).map((r, i) => (
                <p key={i} className="text-xs text-red-600">Row {r._rowIndex}: {r._errors.join(', ')}</p>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button onClick={handleImport} disabled={importing || validCount === 0} className="btn-primary text-xs">
              {importing ? 'Importing...' : `Import ${validCount} valid rows`}
            </button>
            <button onClick={reset} className="btn-secondary text-xs">Cancel</button>
          </div>
        </div>
      )}

      {result && (
        <div className={`rounded-lg p-3 ${result.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-xs ${result.success ? 'text-emerald-700' : 'text-red-700'}`}>
            {result.success ? `Successfully imported ${result.count} rows` : `Import failed: ${result.error}`}
          </p>
        </div>
      )}
    </div>
  );
}
