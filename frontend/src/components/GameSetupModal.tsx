/**
 * GameSetupModal Component
 * Step wizard for configuring games with file selection and settings
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, FileText, Settings, Sparkles } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import GenerationLoader from '@/components/ui/GenerationLoader';
import FileSelector from '@/components/FileSelector';
import { UploadedFile } from '@/types/global';
import { clsx } from 'clsx';

interface GameSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  onStartGame: (config: GameConfig) => void;
  userFiles: UploadedFile[];
}

export interface GameConfig {
  selectedFileIds: string[];
  difficulty: 'easy' | 'normal' | 'hard';
  questionCount: 10 | 20 | 50;
}

type SetupStep = 'source' | 'settings' | 'generating';

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', description: 'Simple questions, basic concepts' },
  { value: 'normal', label: 'Normal', description: 'Balanced difficulty, comprehensive' },
  { value: 'hard', label: 'Hard', description: 'Advanced concepts, critical thinking' },
] as const;

const QUESTION_COUNTS = [
  { value: 10, label: '10 Questions', description: 'Quick round (~5 min)' },
  { value: 20, label: '20 Questions', description: 'Standard round (~10 min)' },
  { value: 50, label: '50 Questions', description: 'Extended round (~25 min)' },
] as const;

export default function GameSetupModal({
  isOpen,
  onClose,
  gameTitle,
  onStartGame,
  userFiles,
}: GameSetupModalProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>('source');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [questionCount, setQuestionCount] = useState<10 | 20 | 50>(20);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('source');
      setSelectedFileIds([]);
      setDifficulty('normal');
      setQuestionCount(20);
    }
  }, [isOpen]);

  // Handle file selection toggle
  const handleFileToggle = (fileId: string) => {
    setSelectedFileIds(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep === 'source' && selectedFileIds.length > 0) {
      setCurrentStep('settings');
    }
  };

  // Handle back step
  const handleBack = () => {
    if (currentStep === 'settings') {
      setCurrentStep('source');
    }
  };

  // Handle generate game
  const handleGenerateGame = () => {
    setCurrentStep('generating');
    
    // Simulate generation process
    setTimeout(() => {
      const config: GameConfig = {
        selectedFileIds,
        difficulty,
        questionCount,
      };
      onStartGame(config);
    }, 3000);
  };

  // Check if next step is allowed
  const canProceed = currentStep === 'source' && selectedFileIds.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      closeOnOverlayClick={currentStep !== 'generating'}
      closeOnEscape={currentStep !== 'generating'}
      showCloseButton={currentStep !== 'generating'}
    >
      <div className="relative">
        {/* Header with Progress */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Setup {gameTitle}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Configure your study session
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2">
            {['source', 'settings'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    currentStep === step || (currentStep === 'generating' && step === 'settings')
                      ? 'bg-blue-500 text-white'
                      : index < ['source', 'settings'].indexOf(currentStep)
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  )}
                >
                  {step === 'source' ? <FileText className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                </div>
                {index < 1 && (
                  <div
                    className={clsx(
                      'w-12 h-0.5 mx-2 transition-colors',
                      index < ['source', 'settings'].indexOf(currentStep)
                        ? 'bg-green-500'
                        : 'bg-slate-200 dark:bg-slate-700'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 'source' && (
            <motion.div
              key="source"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  What are we studying?
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Select the files you want to use for this game session
                </p>
              </div>

              <FileSelector
                files={userFiles}
                selectedIds={selectedFileIds}
                onToggle={handleFileToggle}
                multiSelect={true}
                className="mb-6"
              />

              <div className="flex justify-between items-center">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedFileIds.length > 0
                    ? `${selectedFileIds.length} file${selectedFileIds.length === 1 ? '' : 's'} selected`
                    : 'Select at least one file to continue'
                  }
                </div>
                <button
                  onClick={handleNext}
                  disabled={!canProceed}
                  className={clsx(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                    canProceed
                      ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                  )}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    Game Settings
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Customize your study session preferences
                  </p>
                </div>

                {/* Difficulty Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {DIFFICULTIES.map((level) => (
                      <button
                        key={level.value}
                        onClick={() => setDifficulty(level.value)}
                        className={clsx(
                          'p-4 rounded-xl border-2 text-left transition-all',
                          difficulty === level.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        )}
                      >
                        <div className="font-medium text-slate-900 dark:text-white">
                          {level.label}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {level.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Count Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Question Count
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {QUESTION_COUNTS.map((count) => (
                      <button
                        key={count.value}
                        onClick={() => setQuestionCount(count.value)}
                        className={clsx(
                          'p-4 rounded-xl border-2 text-left transition-all',
                          questionCount === count.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        )}
                      >
                        <div className="font-medium text-slate-900 dark:text-white">
                          {count.label}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {count.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4">
                  <button
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={handleGenerateGame}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium rounded-lg shadow-md transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Game
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center py-8">
                <GenerationLoader
                  isVisible={true}
                  stages={[
                    'Analyzing your files...',
                    'Generating questions...',
                    'Preparing game session...',
                    'Almost ready...',
                  ]}
                />
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    Creating your {gameTitle}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    This should only take a few moments...
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}