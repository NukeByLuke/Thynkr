/**
 * LibraryHeader Component
 * Premium digital library header with advanced upload button and search functionality.
 */

import { useState } from 'react';
import { Search, Plus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface LibraryHeaderProps {
  onUploadClick: () => void;
  onSearch?: (query: string) => void;
  fileCount?: number;
  isUploading?: boolean;
}

export default function LibraryHeader({
  onUploadClick,
  onSearch,
  fileCount = 0,
  isUploading = false,
}: LibraryHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* Left: Title Section */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-xl rounded-xl shadow-lg border border-white/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                My Library
              </h1>
              <p className="text-white/80 text-sm mt-0.5">
                {fileCount} {fileCount === 1 ? 'file' : 'files'} available
              </p>
            </div>
          </div>

          {/* Right: Premium Upload Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative group"
          >
            {/* Gradient Border Container */}
            <div className="p-[1px] rounded-xl bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500 shadow-lg transition-all duration-150 group-hover:shadow-xl group-hover:shadow-blue-500/50">
              {/* Inner Button */}
              <button
                onClick={onUploadClick}
                disabled={isUploading}
                className="relative flex items-center gap-2.5 px-6 py-3 bg-slate-900 dark:bg-slate-950 backdrop-blur-md rounded-[11px] transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
              >
                {/* Animated Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 via-blue-600/0 to-cyan-600/0 group-hover:from-violet-600/10 group-hover:via-blue-600/10 group-hover:to-cyan-600/10 transition-all duration-150" />

                {/* Icon */}
                <div className="relative">
                  {isUploading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full" />
                  ) : (
                    <Plus className="h-5 w-5 text-white group-hover:rotate-90 transition-transform duration-150" />
                  )}
                </div>

                {/* Text */}
                <span className="relative text-white font-medium whitespace-nowrap">
                  {isUploading ? 'Uploading...' : 'Upload New File'}
                </span>

                {/* Glow Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <div className="absolute inset-0 blur-xl bg-gradient-to-r from-violet-500/20 via-blue-500/20 to-cyan-500/20" />
                </div>
              </button>
            </div>

            {/* Pulsing Border Animation (Active Upload) */}
            {isUploading && (
              <div className="absolute inset-0 rounded-xl">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500 opacity-75 animate-pulse" />
              </div>
            )}
          </motion.div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-white/60" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search your files..."
            className="w-full pl-11 pr-4 py-3 bg-white/10 dark:bg-slate-900/30 backdrop-blur-xl border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                onSearch?.('');
              }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/60 hover:text-white transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Fade Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}
