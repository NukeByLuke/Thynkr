import React, { useRef, useState, useEffect, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { PlayerCardExport } from './PlayerCardExport';
import { Download, Image as ImageIcon, Check, Link as LinkIcon, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import type { UserAchievement } from './gamification.utils';
import { useTheme } from '@/contexts/ThemeContext';

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    username: string;
    avatarUrl?: string | null;
    xp: number;
    level: number;
  };
  achievements: UserAchievement[];
}

export const ShareProfileModal: React.FC<ShareProfileModalProps> = ({ isOpen, onClose, user, achievements }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copyingLink, setCopyingLink] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { theme } = useTheme();

  // Generate preview when modal opens
  const generatePreview = useCallback(async () => {
    if (!cardRef.current) return;
    
    setIsGenerating(true);
    try {
      // Wait for DOM to settle and images to load
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: theme === 'dark' ? '#020617' : '#fdfbf7',
        scale: 2, // High res
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: 1200,
        height: 630,
      });
      
      // Generate data URL for preview
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setPreviewUrl(dataUrl);
      
      // Generate blob for copy/download
      canvas.toBlob((blob) => {
        if (blob) setPreviewBlob(blob);
      }, 'image/png', 1.0);
      
    } catch (e) {
      console.error('Preview generation error:', e);
      toast.error('Failed to generate preview');
    } finally {
      setIsGenerating(false);
    }
  }, [theme]);

  // Regenerate preview when modal opens or theme changes
  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(null);
      setPreviewBlob(null);
      // Small delay for off-screen DOM to render
      const timer = setTimeout(generatePreview, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, generatePreview]);

  const handleCopyLink = async () => {
    const url = `${window.location.protocol}//${window.location.host}/u/${user.username}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyingLink(true);
      toast.success('Profile link copied!');
      setTimeout(() => setCopyingLink(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleDownloadImage = async () => {
    if (!previewUrl) {
      toast.error('Image not ready yet');
      return;
    }
    
    const link = document.createElement('a');
    link.download = `thynkr-${user.username}-card.png`;
    link.href = previewUrl;
    link.click();
    toast.success('Image downloaded!');
  };
  
  const handleCopyImage = async () => {
    if (!previewBlob) {
      toast.error('Image not ready yet');
      return;
    }
    
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': previewBlob })
      ]);
      toast.success('Image copied to clipboard!');
    } catch (err) {
      console.error('Copy error:', err);
      toast.error('Browser does not support copying images');
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Share Your Profile" 
      size="xl"
      className="max-w-3xl w-full"
    >
      <div className="flex flex-col gap-5">
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Download your player card or share your profile link.
        </p>

        {/* Preview Area */}
        <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 overflow-hidden">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-pink-60000 mb-3" />
              <span className="text-slate-500 dark:text-slate-400 text-sm">Generating preview...</span>
            </div>
          ) : previewUrl ? (
            <img 
              src={previewUrl} 
              alt="Profile Card Preview" 
              style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
            />
          ) : (
            <div className="flex items-center justify-center py-20">
              <span className="text-slate-500 dark:text-slate-400 text-sm">Loading...</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <Button 
            variant="secondary" 
            onClick={handleCopyLink} 
            className="flex gap-2 items-center justify-center h-11"
          >
            {copyingLink ? <Check size={18} className="text-green-500" /> : <LinkIcon size={18} />}
            {copyingLink ? 'Copied!' : 'Copy Link'}
          </Button>
          
          <Button 
            variant="secondary" 
            onClick={handleCopyImage} 
            disabled={!previewBlob}
            className="flex gap-2 items-center justify-center h-11"
          >
            <ImageIcon size={18} />
            Copy Image
          </Button>
          
          <Button 
            variant="primary" 
            onClick={handleDownloadImage}
            disabled={!previewUrl}
            className="flex gap-2 items-center justify-center h-11 !bg-gradient-to-r !from-pink-500 !via-fuchsia-500 !to-orange-500 hover:!from-pink-400 hover:!via-fuchsia-400 hover:!to-orange-400"
          >
            <Download size={18} />
            Download
          </Button>
        </div>
      </div>

      {/* Off-screen rendering container - hidden from view */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none' }}>
        <PlayerCardExport
          ref={cardRef}
          user={user}
          achievements={achievements}
          theme={theme}
        />
      </div>
    </Modal>
  );
};
