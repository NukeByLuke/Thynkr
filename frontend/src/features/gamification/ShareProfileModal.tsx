import React, { useRef, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { PlayerCardExport } from './PlayerCardExport';
import { Download, Image as ImageIcon, Check, Link as LinkIcon, Trophy, Star, Zap } from 'lucide-react';
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
  achievements: any[]; // Using any to avoid complex type import chains for now
}

export const ShareProfileModal: React.FC<ShareProfileModalProps> = ({ isOpen, onClose, user, achievements }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copyingLink, setCopyingLink] = useState(false);
  
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  
  // Create stats for the card - using Thynkr brand colors (fuchsia/pink)
  const stats = [
    { label: 'Current Level', value: user.level, icon: Star, color: 'text-amber-400' },
    { label: 'Total XP', value: user.xp >= 1000 ? `${(user.xp / 1000).toFixed(1)}k` : user.xp, icon: Zap, color: 'text-fuchsia-400' },
    { label: 'Achievements', value: unlockedCount, icon: Trophy, color: 'text-pink-400' },
  ];

  const handleCopyLink = async () => {
    // Determine base URL, but for local dev it might differ
    const url = `${window.location.protocol}//${window.location.host}/u/${user.username}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyingLink(true);
      toast.success('Profile link copied!');
      setTimeout(() => setCopyingLink(false), 2000);
    } catch (e) {
      toast.error('Failed to copy link');
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    const toastId = toast.loading('Generating image...');
    try {
      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#020617', // slate-950
        scale: 3, // Higher quality
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: 1200,
        windowHeight: 630,
        onclone: (clonedDoc) => {
          const clonedCard = clonedDoc.getElementById('player-card-export');
          if (clonedCard) {
            clonedCard.style.transform = 'none';
            clonedCard.style.width = '1200px';
            clonedCard.style.height = '630px';
          }
        }
      });
      
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
      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#020617',
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: 1200,
        windowHeight: 630,
        onclone: (clonedDoc) => {
          const clonedCard = clonedDoc.getElementById('player-card-export');
          if (clonedCard) {
            clonedCard.style.transform = 'none';
            clonedCard.style.width = '1200px';
            clonedCard.style.height = '630px';
          }
        }
      });
      
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

        {/* Card Preview - responsive scaling */}
        <div className="flex justify-center bg-slate-100 dark:bg-slate-900 rounded-lg p-3 overflow-hidden">
          <div 
            className="relative w-full"
            style={{ 
              maxWidth: '720px',
              aspectRatio: '1200 / 630'
            }}
          >
            <div 
              className="absolute top-0 left-0 origin-top-left"
              style={{ 
                width: '1200px', 
                height: '630px',
                transform: 'scale(0.6)'
              }}
            >
              <PlayerCardExport
                ref={cardRef}
                user={user}
                totalAchievements={unlockedCount}
                featuredStats={stats}
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
