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
      size="lg"
      className="max-w-3xl"
    >
      <div className="flex flex-col gap-6">
        <div className="text-slate-300 text-base leading-relaxed">
          Show off your progress! Download your player card or share your public profile link.
        </div>

        {/* Enhanced Card Preview Area */}
        <div className="flex justify-center bg-gradient-to-br from-slate-900/60 to-slate-950/80 p-8 rounded-2xl border border-slate-700/50 overflow-hidden relative shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700/20 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full" />
          
          <div className="w-full overflow-x-auto flex justify-center py-4 no-scrollbar relative z-10">
             <div className="origin-center transform scale-[0.6] hover:scale-[0.62] transition-transform duration-150">
                <PlayerCardExport
                  ref={cardRef}
                  user={user}
                  totalAchievements={unlockedCount}
                  featuredStats={stats}
                />
             </div>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button variant="secondary" onClick={handleCopyLink} className="flex gap-2.5 items-center justify-center h-14 font-semibold transition-all hover:scale-105">
            {copyingLink ? <Check size={20} className="text-green-500" /> : <LinkIcon size={20} />}
            <span className="text-base">{copyingLink ? 'Copied!' : 'Copy Link'}</span>
          </Button>
          
          <Button variant="secondary" onClick={handleCopyImage} className="flex gap-2.5 items-center justify-center h-14 font-semibold transition-all hover:scale-105">
            <ImageIcon size={20} />
            <span className="text-base">Copy Image</span>
          </Button>
          
          <Button variant="primary" onClick={handleDownloadImage} className="flex gap-2.5 items-center justify-center h-14 font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 transition-all hover:scale-105 shadow-lg hover:shadow-xl">
            <Download size={20} />
            <span className="text-base">Download PNG</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
