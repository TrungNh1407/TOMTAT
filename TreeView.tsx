
import React, { useState } from 'react';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

export interface TreeNode {
  level: number;
  text: string;
  slug: string;
  children: TreeNode[];
}

interface TreeViewProps {
  tree: TreeNode[];
  onNodeClick: (slug:string) => void;
  activeSlug: string | null;
}

interface TreeNodeComponentProps {
  node: TreeNode;
  onNodeClick: (slug: string) => void;
  activeSlug: string | null;
}

const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({ node, onNodeClick, activeSlug }) => {
  const [isOpen, setIsOpen] = useState(true);

  const hasChildren = node.children.length > 0;
  const isActive = node.slug === activeSlug;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onNodeClick(node.slug);
  };

  return (
    <div>
      <div className="flex items-center text-xs group" style={{ paddingLeft: `${(node.level > 1 ? node.level - 1 : 0) * 0.75}rem` }}>
        {hasChildren ? (
          <button onClick={handleToggle} className="mr-1 p-0.5 rounded-sm hover:bg-slate-200 dark:hover:bg-slate-700" aria-label={isOpen ? 'Collapse section' : 'Expand section'}>
            {isOpen ? <ChevronDownIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" /> : <ChevronRightIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
          </button>
        ) : (
          <div className="w-5 mr-1" /> // Placeholder for alignment
        )}
        <a 
          href={`#${node.slug}`} 
          onClick={handleClick} 
          className={`py-0.5 group-hover:text-[--color-accent-600] dark:group-hover:text-[--color-accent-500] transition-colors break-words rounded-r-md
            ${isActive ? 'font-bold text-[--color-accent-600] dark:text-[--color-accent-500]' : 'text-slate-600 dark:text-slate-300'}
          `}
        >
          {node.text}
        </a>
      </div>
      {isOpen && hasChildren && (
        <div className="space-y-1 mt-1">
          {node.children.map((child, index) => (
            <TreeNodeComponent key={`${child.slug}-${index}`} node={child} onNodeClick={onNodeClick} activeSlug={activeSlug} />
          ))}
        </div>
      )}
    </div>
  );
};


export const TreeView: React.FC<TreeViewProps> = ({ tree, onNodeClick, activeSlug }) => {
  if (tree.length === 0) {
    return null;
  }
  return (
    <nav aria-label="Document outline" className="space-y-1">
        {tree.map((node, index) => (
          <TreeNodeComponent key={`${node.slug}-${index}`} node={node} onNodeClick={onNodeClick} activeSlug={activeSlug} />
        ))}
    </nav>
  );
};
