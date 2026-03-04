import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-app flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-900 dark:text-white mb-4">404</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">Page not found</p>
        <Link to="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
