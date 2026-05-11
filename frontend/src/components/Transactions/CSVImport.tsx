import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { transactionsApi } from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export const CSVImport = ({ isOpen, onClose, onSuccess }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      setFile(accepted[0]);
      setStatus('idle');
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (!file) return;
    setStatus('loading');
    try {
      const res = await transactionsApi.importCsv(file);
      setResult(res.data);
      setStatus('success');
      if (res.data.imported > 0) onSuccess();
    } catch {
      setStatus('error');
    }
  };

  const handleClose = () => {
    setFile(null);
    setStatus('idle');
    setResult(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import CSV">
      <div className="space-y-4">
        {/* Format hint */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
          <p className="text-xs font-medium text-indigo-700 mb-1">Expected CSV format:</p>
          <code className="text-xs text-indigo-600 block">
            Date, Amount, Type, Category, Description, Recurring, RecurringInterval
          </code>
          <p className="text-xs text-indigo-500 mt-1">
            Date: YYYY-MM-DD | Type: income/expense | Recurring: true/false
          </p>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-indigo-400 bg-indigo-50'
              : file
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileText size={32} className="text-emerald-500" />
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload size={32} className="text-gray-400" />
              <p className="text-sm text-gray-600">
                {isDragActive ? 'Drop CSV here' : 'Drag & drop a CSV file, or click to select'}
              </p>
              <p className="text-xs text-gray-400">Max 5MB</p>
            </div>
          )}
        </div>

        {/* Result */}
        {status === 'success' && result && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-start gap-2">
            <CheckCircle size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-800">
                Imported {result.imported} transactions
                {result.skipped > 0 && `, skipped ${result.skipped}`}
              </p>
              {result.errors.slice(0, 3).map((e, i) => (
                <p key={i} className="text-xs text-emerald-600 mt-0.5">{e}</p>
              ))}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 flex items-center gap-2">
            <AlertCircle size={18} className="text-rose-500" />
            <p className="text-sm text-rose-700">Import failed. Please check the file format.</p>
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={handleClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
            {status === 'success' ? 'Done' : 'Cancel'}
          </button>
          {status !== 'success' && (
            <button
              type="button"
              onClick={handleImport}
              disabled={!file || status === 'loading'}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {status === 'loading' ? 'Importing...' : 'Import'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
