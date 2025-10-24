import React, { useRef } from 'react';
import { YouTubePlayer } from './YouTubePlayer';
import { TranscriptDisplay } from './TranscriptDisplay';

interface YouTubeViewProps {
  videoId: string;
  transcript: string;
}

export const YouTubeView: React.FC<YouTubeViewProps> = ({ videoId, transcript }) => {
  const playerRef = useRef<any>(null);

  const handleTimestampClick = (timeInSeconds: number) => {
    playerRef.current?.seekTo(timeInSeconds, true);
    playerRef.current?.playVideo();
  };

  return (
    <div className="w-full max-w-6xl mx-auto my-4 bg-transparent sm:bg-white sm:dark:bg-slate-800 rounded-none sm:rounded-xl shadow-none sm:shadow-lg border-0 sm:border border-slate-200 dark:border-slate-700 p-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="aspect-video">
          <YouTubePlayer videoId={videoId} playerRef={playerRef} />
        </div>
        <div className="relative max-h-[450px] overflow-y-auto pr-2 p-4 sm:p-0">
           <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3 sticky top-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm pb-2">Bản ghi</h3>
          <TranscriptDisplay transcript={transcript} onTimestampClick={handleTimestampClick} />
        </div>
      </div>
    </div>
  );
};