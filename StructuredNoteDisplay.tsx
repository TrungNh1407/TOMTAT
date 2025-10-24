import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { TreeView } from './TreeView';
import type { TreeNode } from './TreeView';

interface StructuredNoteDisplayProps {
  data: any;
  scrollToSlug?: string | null;
}

// Hàm trợ giúp để tạo slug từ văn bản
const createSlug = (text: string) => {
  return String(text)
    .normalize('NFD') // Chuẩn hóa thành các ký tự phân tách
    .replace(/[\u0300-\u036f]/g, '') // Loại bỏ các dấu phụ
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Thay thế khoảng trắng bằng -
    .replace(/[^\w-]+/g, '') // Loại bỏ tất cả các ký tự không phải từ
    .replace(/--+/g, '-'); // Thay thế nhiều - bằng một - duy nhất
};

// Hàm trợ giúp để render các khối nội dung khác nhau
const ContentBlock: React.FC<{ block: any }> = ({ block }) => {
  const { type, content, headers, rows, title, icon } = block;

  const renderContent = () => {
    switch (type) {
      case 'paragraph':
        return <p>{icon && <span className="mr-2">{icon}</span>}{content}</p>;
      case 'list':
        return (
          <ul className="list-disc list-inside space-y-1">
            {content.map((item: string, index: number) => <li key={index}>{icon && <span className="mr-2">{icon}</span>}{item}</li>)}
          </ul>
        );
      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  {headers.map((header: string, index: number) => (
                    <th key={index} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {rows.map((row: string[], rowIndex: number) => (
                  <tr key={rowIndex} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    {row.map((cell: string, cellIndex: number) => <td key={cellIndex} className="px-4 py-2 whitespace-normal">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'keyPoint':
        return <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 rounded-r-lg">{icon && <span className="mr-2">{icon}</span>}{content}</div>;
      case 'warning':
        return <div className="p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 rounded-r-lg">{icon && <span className="mr-2">{icon}</span>}{content}</div>;
      case 'clinicalCase':
        return <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-600 rounded-r-lg"><h4 className="font-semibold mb-1">{icon && <span className="mr-2">{icon}</span>}{title}</h4><p>{content}</p></div>;
      default:
        return <p>{JSON.stringify(block)}</p>;
    }
  };
  return <div className="mb-4">{renderContent()}</div>;
};

export const StructuredNoteDisplay: React.FC<StructuredNoteDisplayProps> = ({ data, scrollToSlug }) => {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const contentRefs = useRef<Record<string, Element | null>>({});

  const tocTree = useMemo((): TreeNode[] => {
    const buildTree = (items: any[]): TreeNode[] => {
        if (!items) return [];
        return items.map(item => ({
            level: item.level,
            text: item.title,
            slug: createSlug(item.title),
            children: buildTree(item.children || []),
        }));
    };
    return buildTree(data.mainContent);
  }, [data.mainContent]);

  useEffect(() => {
    if (scrollToSlug) {
        const element = contentRefs.current[scrollToSlug];
        if (element) {
            (element as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveSlug(scrollToSlug);
        }
    }
  }, [scrollToSlug]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const intersectingEntry = entries.find(entry => entry.isIntersecting);
        if (intersectingEntry) {
            setActiveSlug(intersectingEntry.target.id);
        }
      },
      { rootMargin: '-20% 0px -80% 0px', threshold: 0 }
    );

    // FIX: Use a type predicate with .filter() to create a correctly typed Element[] array.
    // This resolves an issue where the type of 'el' was not being inferred correctly.
    const elementsToObserve = Object.values(contentRefs.current).filter((el): el is Element => el != null);
    
    elementsToObserve.forEach(el => {
      observer.observe(el);
    });

    return () => {
        elementsToObserve.forEach(el => {
            observer.unobserve(el);
        });
    };
  }, [tocTree]);

  const handleNodeClick = useCallback((slug: string) => {
    (contentRefs.current[slug] as HTMLElement)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSlug(slug);
  }, []);

  const renderContent = (items: any[]) => {
    return items.map((item, index) => {
      const slug = createSlug(item.title);
      const HeadingTag = `h${Math.min(item.level + 1, 6)}` as React.ElementType;
      return (
        <div key={`${slug}-${index}`} id={slug} ref={el => { contentRefs.current[slug] = el; }} className="mb-6 scroll-mt-16">
          <HeadingTag className="font-bold mb-3">{item.title}</HeadingTag>
          {item.contentBlocks?.map((block: any, blockIndex: number) => (
            <ContentBlock key={blockIndex} block={block} />
          ))}
          {item.children && renderContent(item.children)}
        </div>
      );
    });
  };
  
  if (!data) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {tocTree.length > 0 && (
        <aside className="lg:w-1/4 lg:sticky lg:top-4 lg:self-start p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <h3 className="font-semibold text-sm mb-3">Mục lục</h3>
          <TreeView tree={tocTree} onNodeClick={handleNodeClick} activeSlug={activeSlug} />
        </aside>
      )}
      <main className={tocTree.length > 0 ? "lg:w-3/4" : "w-full"}>
        <div ref={el => { contentRefs.current['introduction'] = el; }} id="introduction" className="scroll-mt-16">
          <h2 className="text-xl font-bold mb-4">{data.title}</h2>
          {data.introduction && <p className="mb-6 text-slate-600 dark:text-slate-400">{data.introduction.objective}</p>}
        </div>
        {data.mainContent && renderContent(data.mainContent)}
      </main>
    </div>
  );
};
