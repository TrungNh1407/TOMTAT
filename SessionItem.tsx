import React, { useState, useRef, useEffect } from 'react';
import type { Session } from './types';
import { TrashIcon } from './icons/TrashIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { CheckIcon } from './icons/CheckIcon';

interface SessionItemProps {
  session: Session;
  isActive: boolean;
  isHighlighted: boolean;
  loadSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, newTitle: string) => void;
}

export const SessionItem: React.FC<SessionItemProps> = ({ session, isActive, isHighlighted, loadSession, deleteSession, renameSession }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(session.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(session.title);
  }, [session.title]);
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  const handleRename = () => {
    if (title.trim() && title !== session.title) {
      renameSession(session.id, title.trim());
    } else {
      setTitle(session.title);
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleRename();
    else if (e.key === 'Escape') {
      setTitle(session.title);
      setIsEditing(false);
    }
  };

  return (
    <li className={`rounded-md transition-all duration-300 ${isHighlighted ? 'bg-[--color-accent-500]/20 scale-[1.02]' : ''}`}>
      <div className={`group flex items-center w-full text-left p-2 rounded-md ${isActive ? 'bg-[--color-accent-500]/10' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            className="flex-grow bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-0 border-b border-[--color-accent-500]"
          />
        ) : (
          <button onClick={() => loadSession(session.id)} className="flex-grow text-left overflow-hidden">
            <p className={`text-sm truncate ${isActive ? 'font-semibold text-[--color-accent-700] dark:text-[--color-accent-400]' : 'font-medium text-slate-600 dark:text-slate-300'} ${session.title === 'Cuộc trò chuyện mới' ? 'italic text-slate-500 dark:text-slate-400' : ''}`} title={session.title}>
              {session.title}
            </p>
          </button>
        )}
        <div className={`flex-shrink-0 flex items-center space-x-1 pl-2 ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}>
          {isEditing ? (
            <button onClick={handleRename} className="p-1 rounded-md text-green-500 hover:bg-green-100 dark:hover:bg-green-900/50">
              <CheckIcon className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => setIsEditing(true)} className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
              <PencilSquareIcon className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => deleteSession(session.id)} className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </li>
  );
};