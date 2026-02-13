import React, { useRef, useState, useEffect, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { PlayerCardExport } from './PlayerCardExport';
import { Download, Image as ImageIcon, Check, Link as LinkIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    username: string;
    avatarUrl?: string | null;
    xp: number;
    level: number;
  };
  achievements: any[];
}

export const ShareProfileModal: React.FC<ShareProfileModalProps> = ({ isOpen, onClose, user, achievements }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [copyingLink, setCopyingLink] = useState(false);
  const [scale, setScale] = useState(0.5);
  
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  // Calculate scale based on container width
  const calculateScale = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const newScale = Math.min(containerWidth / 1200, 0.6); // Cap at 0.6 to prevent too large
      setScale(newScale);
    }
  }, []);

  // Recalculate on mount, resize, and modal open
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure modal is rendered
      setTimeout(calculateScale, 50);
      window.addEventListener('resize', calculateScale);
      return () => window.removeEventListener('resize', calculateScale);
    }
  }, [isOpen, calculateScale]);

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

  // Shared html2canvas config - crucial: onclone resets all transforms
  const getHtml2CanvasConfig = () => ({
    backgroundColor: '#020617',
    scale: 2, // High res output
    useCORS: true,
    allowTaint: true,
    logging: false,
    width: 1200,
    height: 630,
    onclone: (documentClone: Document) => {
      const element = documentClone.getElementById('player-card-export');
      if (element) {
        // Reset all transform/scaling artifacts from preview
        element.style.transform = 'none';
        element.style.margin = '0';
        element.style.borderRadius = '0';
        element.style.width = '1200px';
        element.style.height = '630px';
      }
    }
  });

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    const toastId = toast.loading('Generating image...');
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const canvas = await html2canvas(cardRef.current, getHtml2CanvasConfig());
      const link = document.createElement('a');
      link.download = `thynkr-${user.username}-card.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      toast.success('Image downloaded!', { id: toastId });
    } catch (e) {
      console.error('Download error:', e);
      toast.error('Failed to generate image', { id: toastId });
    }
  };
  
  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    const toastId = toast.loading('Generating image...');
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const canvas = await html2canvas(cardRef.current, getHtml2CanvasConfig());
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Failed to create blob', { id: toastId });
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          toast.success('Image copied to clipboard!', { id: toastId });
        } catch (err) {
          console.error('Copy error:', err);
          toast.error('Browser does not support copying images', { id: toastId });
        }
      }, 'image/png', 1.0);
    } catch (e) {
      console.error('Generate error:', e);
      toast.error('Failed to generate image', { id: toastId });
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

        {/* Card Preview - dynamic scaling */}
        <div 
          ref={containerRef}
          className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 overflow-hidden"
        >
          {/* Height reservation container */}
          <div style={{ height: 630 * scale, overflow: 'hidden' }}>
            {/* Scaled card container */}
            <div
              style={{
                width: '1200px',
                height: '630px',
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            >
              <PlayerCardExport
                ref={cardRef}
                user={user}
                totalAchievements={unlockedCount}
              />
            </div>
          </div>
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
            className="flex gap-2 items-center justify-center h-11"
          >
            <ImageIcon size={18} />
            Copy Image
          </Button>
          
          <Button 
            variant="primary" 
            onClick={handleDownloadImage} 
            className="flex gap-2 items-center justify-center h-11 !bg-gradient-to-r !from-pink-500 !via-fuchsia-500 !to-orange-500 hover:!from-pink-400 hover:!via-fuchsia-400 hover:!to-orange-400"
          >
            <Download size={18} />
            Download
          </Button>
        </div>
      </div>
    </Modal>
  );
};
