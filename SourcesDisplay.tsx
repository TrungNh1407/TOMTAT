import React from 'react';
import type { GroundingChunk } from "@google/genai";
import { LinkIcon } from './icons/LinkIcon';

interface SourcesDisplayProps {
  sources: GroundingChunk[];
  onSourceClick: (uri: string) => void;
}

export const SourcesDisplay: React.FC<SourcesDisplayProps> = ({ sources, onSourceClick }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  // Lọc ra các nguồn web duy nhất
  const uniqueSources = sources.reduce((acc, current) => {
    if (current.web && !acc.find(item => item.web?.uri === current.web?.uri)) {
      acc.push(current);
    }
    return acc;
  }, [] as GroundingChunk[]);

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center">
        <LinkIcon className="w-4 h-4 mr-2" />
        Nguồn
      </h3>
      <ul className="space-y-1.5">
        {uniqueSources.map((source, index) => (
          source.web && (
            <li key={index} className="flex items-start">
              <span className="text-slate-500 dark:text-slate-400 mr-2 text-xs pt-1">&#8226;</span>
              <a
                href={source.web.uri}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => { e.preventDefault(); onSourceClick(source.web.uri); }}
                className="text-left text-sm text-[--color-accent-600] hover:underline dark:text-[--color-accent-500] dark:hover:text-[--color-accent-400] truncate"
                title={source.web.title}
              >
                {source.web.title || source.web.uri}
              </a>
            </li>
          )
        ))}
      </ul>
    </div>
  );
};