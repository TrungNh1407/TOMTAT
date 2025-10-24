import React, { useMemo } from 'react';

interface TranscriptDisplayProps {
  transcript: string;
  onTimestampClick: (timeInSeconds: number) => void;
}

const timeToSeconds = (time: string): number => {
    const parts = time.split(':').map(Number);
    if (parts.length === 2) { // MM:SS
        return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3) { // HH:MM:SS
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
};

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ transcript, onTimestampClick }) => {
  const parsedTranscript = useMemo(() => {
    const lines = transcript.split('\n');
    const timestampRegex = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.*)/;

    return lines.map((line, index) => {
      const match = line.match(timestampRegex);
      if (match) {
        const time = match[1];
        const text = match[2];
        const seconds = timeToSeconds(time);
        return (
          <p key={index} className="mb-2">
            <button
              onClick={() => onTimestampClick(seconds)}
              className="font-mono text-sm px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[--color-accent-600] dark:text-[--color-accent-400] hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors mr-2"
            >
              {time}
            </button>
            <span className="text-slate-700 dark:text-slate-300">{text}</span>
          </p>
        );
      }
      if (line.trim()) {
        return <p key={index} className="mb-2 text-slate-700 dark:text-slate-300">{line}</p>;
      }
      return null;
    }).filter(Boolean);
  }, [transcript, onTimestampClick]);

  if (parsedTranscript.length === 0) {
      return <p className="text-slate-500 dark:text-slate-400">Không có bản ghi nào được tìm thấy hoặc định dạng không được hỗ trợ.</p>
  }

  return <div className="text-sm leading-relaxed">{parsedTranscript}</div>;
};