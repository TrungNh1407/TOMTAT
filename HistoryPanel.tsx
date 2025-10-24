import React, { useState, useMemo } from 'react';
import type { Session } from './types';
import { PlusIcon } from './icons/PlusIcon';
import { SearchIcon } from './icons/SearchIcon';
import { SessionItem } from './SessionItem';

interface HistoryPanelProps {
  sessions: Session[];
  currentSession: Session;
  loadSession: (id: string) => void;
  createNewSession: () => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, newTitle: string) => void;
  highlightedSourceId?: string | null;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  sessions,
  currentSession,
  loadSession,
  createNewSession,
  deleteSession,
  renameSession,
  highlightedSourceId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => 
      session.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sessions, searchQuery]);

  return (
      <div className="flex flex-col h-full">
         <header className="flex-shrink-0 p-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-200">Lịch sử</h1>
            <div className="flex items-center gap-1">
                 <button onClick={createNewSession} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="Cuộc trò chuyện mới">
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>
         </header>

        <div className="px-3 pb-3">
          <div className="relative">
            <SearchIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text"
              placeholder="Tìm kiếm lịch sử..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800/50 text-sm font-medium text-slate-700 dark:text-slate-200 border-transparent rounded-md py-2 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-[--color-accent-500] dark:focus:ring-offset-slate-900"
            />
          </div>
        </div>

        <main className="flex-grow px-3 overflow-y-auto">
          {filteredSessions.length > 0 ? (
            <ul className="space-y-1">
              {filteredSessions.map(session => (
                <SessionItem 
                  key={session.id}
                  session={session}
                  isActive={session.id === currentSession.id}
                  isHighlighted={session.id === highlightedSourceId}
                  loadSession={loadSession}
                  deleteSession={deleteSession}
                  renameSession={renameSession}
                />
              ))}
            </ul>
          ) : (
            <div className="text-center py-10">
              <p className="text-slate-500 dark:text-slate-400 text-sm">Không tìm thấy cuộc trò chuyện nào.</p>
            </div>
          )}
        </main>
      </div>
  );
};