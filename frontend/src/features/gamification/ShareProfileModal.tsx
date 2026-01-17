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
  
  // Create stats for the card
  const stats = [
    { label: 'Current Level', value: user.level, icon: Star, color: 'text-amber-400' },
    { label: 'Total XP', value: user.xp >= 1000 ? `${(user.xp / 1000).toFixed(1)}k` : user.xp, icon: Zap, color: 'text-blue-400' },
    { label: 'Achievements', value: unlockedCount, icon: Trophy, color: 'text-purple-400' },
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
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#020617', // slate-950
        scale: 2, // Retina quality
        useCORS: true, // For avatar images
        logging: false
      });
      
      const link = document.createElement('a');
      link.download = `thynkr-${user.username}-card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Image downloaded!', { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate image', { id: toastId });
    }
  };
  
  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    const toastId = toast.loading('Generating image...');
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#020617',
        scale: 2,
        useCORS: true,
        logging: false
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
          console.error(err);
          toast.error('Browser does not support copying images via script', { id: toastId });
        }
      });
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate image', { id: toastId });
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Share Your Profile" 
      size="lg"
      className="max-w-3xl"
    >
      <div className="flex flex-col gap-6">
        <div className="text-slate-400 text-sm">
          Show off your progress! Download your player card or share your public profile link.
        </div>

        {/* Card Preview Area */}
        <div className="flex justify-center bg-slate-900/50 p-6 rounded-xl border border-slate-800/50 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800/20 via-transparent to-transparent pointer-events-none" />
          
          <div className="w-full overflow-x-auto flex justify-center py-2 no-scrollbar">
             <div className="origin-center">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button variant="secondary" onClick={handleCopyLink} className="flex gap-2 items-center justify-center h-12">
            {copyingLink ? <Check size={18} className="text-green-500" /> : <LinkIcon size={18} />}
            <span>{copyingLink ? 'Copied!' : 'Copy Link'}</span>
          </Button>
          
          <Button variant="secondary" onClick={handleCopyImage} className="flex gap-2 items-center justify-center h-12">
            <ImageIcon size={18} />
            <span>Copy Image</span>
          </Button>
          
          <Button variant="primary" onClick={handleDownloadImage} className="flex gap-2 items-center justify-center h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500">
            <Download size={18} />
            <span>Download PNG</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
