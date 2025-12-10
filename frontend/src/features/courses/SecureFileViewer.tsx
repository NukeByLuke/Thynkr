import { useState, useEffect, useRef } from 'react';
import { Music, File, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '';

interface SecureFileViewerProps {
  fileId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  courseTitle: string;
  onClose?: () => void;
}

// Watermark overlay component
function Watermark({ courseTitle, userId }: { courseTitle: string; userId: string }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden z-10"
      style={{ userSelect: 'none' }}
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] rotate-[-30deg]">
        <div className="text-center whitespace-nowrap">
          <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">THYNKR</div>
          <div className="text-lg text-gray-700 dark:text-gray-300 mt-2">{courseTitle}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            User: {userId.slice(0, 8)}...
          </div>
        </div>
      </div>
      {/* Diagonal repeating watermark pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute whitespace-nowrap text-xs font-medium text-gray-900 dark:text-gray-100"
            style={{
              top: `${i * 80}px`,
              left: '-100%',
              width: '300%',
              transform: 'rotate(-30deg)',
            }}
          >
            {Array.from({ length: 10 }).map((_, j) => (
              <span key={j} className="inline-block mx-12">
                THYNKR • {courseTitle} • Protected
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// PDF Viewer using iframe with PDF.js (browser built-in or hosted)
function PDFViewer({
  url,
  courseTitle,
  userId,
}: {
  url: string;
  courseTitle: string;
  userId: string;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="relative w-full h-full min-h-[600px] bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
      <Watermark courseTitle={courseTitle} userId={userId} />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 z-20">
          <AlertCircle className="w-12 h-12 mb-4" />
          <p>{error}</p>
        </div>
      ) : (
        <iframe
          src={`${url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
          className="w-full h-full min-h-[600px] border-0"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError('Failed to load PDF');
          }}
          title="PDF Viewer"
          sandbox="allow-same-origin allow-scripts"
          style={{
            // Prevent context menu and selection
            WebkitUserSelect: 'none',
            userSelect: 'none',
          }}
        />
      )}
    </div>
  );
}

// Image Viewer
function ImageViewer({
  url,
  fileName,
  courseTitle,
  userId,
}: {
  url: string;
  fileName: string;
  courseTitle: string;
  userId: string;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
      <Watermark courseTitle={courseTitle} userId={userId} />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      )}
      {error ? (
        <div className="flex flex-col items-center justify-center text-red-500">
          <AlertCircle className="w-12 h-12 mb-4" />
          <p>Failed to load image</p>
        </div>
      ) : (
        <img
          src={url}
          alt={fileName}
          className="max-w-full max-h-[80vh] object-contain"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          style={{
            WebkitUserSelect: 'none',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

// Video Viewer
function VideoViewer({
  url,
  courseTitle,
  userId,
}: {
  url: string;
  courseTitle: string;
  userId: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Prevent right-click download on video
    const video = videoRef.current;
    if (video) {
      video.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    return () => {
      if (video) {
        video.removeEventListener('contextmenu', (e) => e.preventDefault());
      }
    };
  }, []);

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden">
      <Watermark courseTitle={courseTitle} userId={userId} />
      <video
        ref={videoRef}
        src={url}
        controls
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        className="w-full max-h-[70vh]"
        onContextMenu={(e) => e.preventDefault()}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

// Audio Viewer
function AudioViewer({
  url,
  fileName,
  courseTitle,
  userId,
}: {
  url: string;
  fileName: string;
  courseTitle: string;
  userId: string;
}) {
  return (
    <div className="relative w-full p-8 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg">
      <Watermark courseTitle={courseTitle} userId={userId} />
      <div className="flex flex-col items-center gap-4">
        <Music className="w-16 h-16 text-indigo-600 dark:text-indigo-400" />
        <p className="text-lg font-medium text-gray-900 dark:text-white">{fileName}</p>
        <audio
          src={url}
          controls
          controlsList="nodownload"
          className="w-full max-w-md"
          onContextMenu={(e) => e.preventDefault()}
        >
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
}

// Text/Code Viewer
function TextViewer({
  url,
  fileName,
  courseTitle,
  userId,
}: {
  url: string;
  fileName: string;
  courseTitle: string;
  userId: string;
}) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch file');
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError('Failed to load file content');
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-red-500">
        <AlertCircle className="w-12 h-12 mb-4" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden">
      <Watermark courseTitle={courseTitle} userId={userId} />
      <div className="p-4 border-b border-gray-700">
        <p className="text-sm text-gray-400">{fileName}</p>
      </div>
      <pre
        className="p-4 text-sm text-gray-100 overflow-auto max-h-[600px] font-mono"
        onContextMenu={(e) => e.preventDefault()}
        style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
      >
        {content}
      </pre>
    </div>
  );
}

// Unsupported file type viewer
function UnsupportedViewer({ fileName, fileType }: { fileName: string; fileType: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <File className="w-16 h-16 text-gray-400 mb-4" />
      <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">{fileName}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Preview not available for this file type ({fileType})
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        This file can be viewed within the course materials.
      </p>
    </div>
  );
}

export default function SecureFileViewer({
  fileName,
  fileType,
  fileUrl,
  courseTitle,
}: SecureFileViewerProps) {
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';

  // Build the full URL with API base
  const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${API_URL}${fileUrl}`;

  // Determine which viewer to use based on file type
  const getViewer = () => {
    if (fileType === 'application/pdf') {
      return <PDFViewer url={fullUrl} courseTitle={courseTitle} userId={userId} />;
    }

    if (fileType.startsWith('image/')) {
      return (
        <ImageViewer url={fullUrl} fileName={fileName} courseTitle={courseTitle} userId={userId} />
      );
    }

    if (fileType.startsWith('video/')) {
      return <VideoViewer url={fullUrl} courseTitle={courseTitle} userId={userId} />;
    }

    if (fileType.startsWith('audio/')) {
      return (
        <AudioViewer url={fullUrl} fileName={fileName} courseTitle={courseTitle} userId={userId} />
      );
    }

    if (fileType.startsWith('text/') || fileType === 'application/json') {
      return (
        <TextViewer url={fullUrl} fileName={fileName} courseTitle={courseTitle} userId={userId} />
      );
    }

    return <UnsupportedViewer fileName={fileName} fileType={fileType} />;
  };

  // Block right-click on the entire viewer
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <div className="w-full" onContextMenu={(e) => e.preventDefault()}>
      {getViewer()}
    </div>
  );
}

// Export individual viewers for direct use
export { PDFViewer, ImageViewer, VideoViewer, AudioViewer, TextViewer, Watermark };
