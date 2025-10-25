import React, { useState, useMemo } from 'react';
import type { Session } from './types';
import { SearchIcon } from './icons/SearchIcon';
import { SessionItem } from './SessionItem';
import { PlusIcon } from './icons/PlusIcon';

interface MobileHistoryPanelProps {
  sessions: Session[];
  currentSession: Session;
  loadSession: (id: string) => void;
  createNewSession: () => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, newTitle: string) => void;
}

export const MobileHistoryPanel: React.FC<MobileHistoryPanelProps> = ({
  sessions,
  currentSession,
  loadSession,
  createNewSession,
  deleteSession,
  renameSession,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => 
      session.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sessions, searchQuery]);

  return (
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0">
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

        <main className="flex-grow pt-3 overflow-y-auto -mr-4 pr-4">
          {filteredSessions.length > 0 ? (
            <ul className="space-y-1">
              {filteredSessions.map(session => (
                <SessionItem 
                  key={session.id}
                  session={session}
                  isActive={session.id === currentSession.id}
                  isHighlighted={false}
                  loadSession={loadSession}
                  deleteSession={deleteSession}
                  renameSession={renameSession}
                />
              ))}
            </ul>
          ) : (
            <div className="text-center py-10">
              <p className="text-slate-500 dark:text-slate-400 text-sm">Không tìm thấy cuộc trò chuyện nào.</p>
              <button
                  onClick={createNewSession}
                  className="mt-6 flex items-center justify-center mx-auto px-5 py-2.5 bg-[--color-accent-600] text-white font-semibold rounded-md shadow-sm hover:bg-[--color-accent-700] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--color-accent-500]"
              >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Cuộc trò chuyện mới
              </button>
            </div>
          )}
        </main>
      </div>
  );
};