import { useState } from 'react';
import Logo from '@/components/Logo';

export default function PreviewGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const previewPassword = (import.meta.env.VITE_PREVIEW_PASSWORD as string) || '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === previewPassword) {
      setError('');
      onSuccess();
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Logo variant="symbol" size="md" className="h-8 w-8" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Thynkr Preview</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Enter the preview password to continue.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            autoFocus
            placeholder="Preview password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
          <button
            type="submit"
            className="w-full px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
