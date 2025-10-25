import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { translateTexts } from './aiService';
import { Loader } from './Loader';
import { LanguageIcon } from './icons/LanguageIcon';

interface TocSelectorProps {
  tocMarkdown: string;
  fileName: string;
  onSummarize: (sections: string[]) => void;
  onCancel: () => void;
  isLoading: boolean;
}

interface TocNode {
  level: number;
  text: string;
  children: TocNode[];
}

// Phân tích markdown thành cấu trúc cây
const parseTocToTree = (markdown: string): TocNode[] => {
  const lines = markdown.split('\n');
  const root: TocNode = { level: 0, text: 'root', children: [] };
  const path: TocNode[] = [root]; // Một stack để theo dõi đường dẫn hiện tại trong cây
  const headingRegex = /^(#+)\s+(.*)/;
  
  lines.forEach(line => {
    const match = line.match(headingRegex);
    if (match) {
      const text = match[2].trim();
      if (text && /(\p{L}|\p{N})/u.test(text)) {
        const level = match[1].length;
        const newNode: TocNode = { level, text, children: [] };
        
        while (path.length > 0 && path[path.length - 1].level >= level) {
          path.pop();
        }
        
        if (path.length > 0) {
            path[path.length - 1].children.push(newNode);
            path.push(newNode);
        }
      }
    }
  });
  return root.children;
};

// Lấy tất cả văn bản từ một cây các nút một cách đệ quy
const getAllNodeTexts = (nodes: TocNode[]): string[] => {
  let texts: string[] = [];
  for (const node of nodes) {
    texts.push(node.text);
    if (node.children.length > 0) {
      texts = texts.concat(getAllNodeTexts(node.children));
    }
  }
  return texts;
};

interface TocNodeComponentProps {
    node: TocNode;
    selected: Record<string, boolean>;
    translations: Record<string, string>;
    onToggle: (nodeText: string) => void;
    descendantTextMap: Map<string, string[]>;
}

const TocNodeComponent: React.FC<TocNodeComponentProps> = ({ node, selected, translations, onToggle, descendantTextMap }) => {
    const checkboxRef = useRef<HTMLInputElement>(null);
    const isChecked = selected[node.text] || false;

    const isIndeterminate = useMemo(() => {
        const descendantTexts = descendantTextMap.get(node.text) || [];
        if (descendantTexts.length === 0) return false;
        const selectedCount = descendantTexts.filter(text => selected[text]).length;
        return selectedCount > 0 && selectedCount < descendantTexts.length;
    }, [node.text, descendantTextMap, selected]);

    useEffect(() => {
        if (checkboxRef.current) {
            checkboxRef.current.indeterminate = isIndeterminate;
        }
    }, [isIndeterminate]);

    return (
        <>
            <label
                className={`flex items-start cursor-pointer p-2 rounded-md transition-colors ${
                  isChecked || isIndeterminate
                    ? 'bg-[--color-accent-500]/10'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
                style={{ marginLeft: `${(node.level - 1) * 1.5}rem` }}
            >
                <input
                    ref={checkboxRef}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggle(node.text)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-[--color-accent-600] focus:ring-[--color-accent-600] mt-0.5 dark:bg-slate-800 dark:checked:bg-[--color-accent-600]"
                />
                <span
                    className={`ml-3 block text-sm transition-colors ${
                      isChecked
                        ? 'font-semibold text-[--color-accent-700] dark:text-[--color-accent-400]'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                    title={node.text}
                >
                    {translations[node.text] || node.text}
                </span>
            </label>
            {node.children.map(child => (
                <TocNodeComponent
                    key={child.text}
                    node={child}
                    selected={selected}
                    translations={translations}
                    onToggle={onToggle}
                    descendantTextMap={descendantTextMap}
                />
            ))}
        </>
    );
};


export const TocSelector: React.FC<TocSelectorProps> = ({ tocMarkdown, fileName, onSummarize, onCancel, isLoading }) => {
  const tree = useMemo(() => parseTocToTree(tocMarkdown), [tocMarkdown]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  
  const allHeadingsTexts = useMemo(() => getAllNodeTexts(tree), [tree]);

  const descendantTextMap = useMemo(() => {
    const map = new Map<string, string[]>();
    const traverse = (nodes: TocNode[]) => {
      nodes.forEach(node => {
        const texts = getAllNodeTexts(node.children);
        map.set(node.text, texts);
        traverse(node.children);
      });
    };
    traverse(tree);
    return map;
  }, [tree]);

  const handleTranslate = async () => {
    if (allHeadingsTexts.length === 0 || Object.keys(translations).length > 0) {
      return;
    }
    setIsTranslating(true);
    setTranslationError(null);
    try {
      const translationMap = await translateTexts(allHeadingsTexts);
      setTranslations(translationMap);
    } catch (err) {
      console.error("Translation failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định trong quá trình dịch.";
      if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
        setTranslationError("API đã đạt giới hạn. Vui lòng thử lại sau ít phút.");
      } else {
        setTranslationError("Không thể dịch các tiêu đề vào lúc này.");
      }
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    const initialSelection: Record<string, boolean> = {};
    allHeadingsTexts.forEach(text => {
      initialSelection[text] = true;
    });
    setSelected(initialSelection);
  }, [allHeadingsTexts]);
  
  const handleToggle = (toggledNodeText: string) => {
    setSelected(currentSelected => {
        const newSelected = { ...currentSelected };
        const newCheckedState = !newSelected[toggledNodeText];

        // 1. Cập nhật nút đã chuyển đổi và tất cả các nút con của nó
        const descendants = descendantTextMap.get(toggledNodeText) || [];
        newSelected[toggledNodeText] = newCheckedState;
        descendants.forEach(text => { newSelected[text] = newCheckedState; });

        // 2. Cập nhật các nút cha bằng cách đánh giá lại trạng thái cha của toàn bộ cây
        const reEvaluateParents = (nodes: TocNode[]) => {
            nodes.forEach(node => {
                if (node.children.length > 0) {
                    reEvaluateParents(node.children); // Đệ quy trước
                    const allChildrenSelected = node.children.every(child => newSelected[child.text]);
                    newSelected[node.text] = allChildrenSelected;
                }
            });
        };
        reEvaluateParents(tree);

        return newSelected;
    });
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const allSelected = allHeadingsTexts.length > 0 && selectedCount === allHeadingsTexts.length;

  const handleToggleAll = () => {
    const newSelected: Record<string, boolean> = {};
    const shouldSelectAll = !allSelected;
    allHeadingsTexts.forEach(text => {
      newSelected[text] = shouldSelectAll;
    });
    setSelected(newSelected);
  };
  
  const handleSummarizeSelectedClick = () => {
    const selectedSections = Object.entries(selected)
      .filter(([, isSelected]) => isSelected)
      .map(([text]) => text);
    onSummarize(selectedSections);
  };

  if (tree.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-center p-8 border border-dashed rounded-lg border-slate-300 dark:border-slate-600">
          <p className="font-semibold text-slate-700 dark:text-slate-200">Không tìm thấy cấu trúc</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">AI không thể xác định được cấu trúc tiêu đề trong tài liệu này. Bạn có muốn tóm tắt toàn bộ tài liệu không?</p>
          <div className="mt-6 flex justify-center gap-4">
            <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-semibold rounded-md border border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 text-slate-700 bg-white dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600 dark:focus:ring-slate-500 transition-colors"
              >
                Hủy
              </button>
              <button
                  onClick={() => onSummarize(['all'])}
                  disabled={isLoading}
                  className="flex-shrink-0 flex items-center justify-center px-5 py-2.5 bg-[--color-accent-600] text-white font-semibold rounded-md shadow-sm hover:bg-[--color-accent-700] disabled:bg-slate-400 disabled:dark:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--color-accent-500]"
              >
                {isLoading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span>Đang tạo...</span>
                    </>
                ) : (
                    <>
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        <span>Tóm tắt toàn bộ</span>
                    </>
                )}
              </button>
          </div>
        </div>
      </div>
    )
  }

  const summarizeButtonText = selectedCount > 0 ? `Tóm tắt ${selectedCount} phần đã chọn` : 'Tóm tắt phần đã chọn';

  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-6">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between gap-4 mb-2">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Chọn các phần để tóm tắt</h3>
              {!isTranslating && Object.keys(translations).length === 0 && allHeadingsTexts.length > 0 && (
                  <button
                      onClick={handleTranslate}
                      className="flex items-center px-3 py-1 text-xs font-semibold rounded-md border border-slate-300 hover:bg-slate-100 text-slate-600 bg-white dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600 transition-colors"
                  >
                      <LanguageIcon className="w-4 h-4 mr-1.5" />
                      Dịch sang Tiếng Việt
                  </button>
              )}
              {isTranslating && (
                  <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                      <div className="w-3 h-3 border-2 border-[--color-accent-500] border-t-transparent rounded-full animate-spin mr-2"></div>
                      Đang dịch...
                  </div>
              )}
          </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">AI đã phân tích cấu trúc của tệp <span className="font-semibold text-slate-600 dark:text-slate-300">{fileName}</span>. Vui lòng chọn các mục bạn muốn đưa vào bản tóm tắt.</p>
        
        {translationError && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-600 text-yellow-800 dark:text-yellow-300 px-4 py-3 rounded-lg mb-4 text-sm" role="alert">
            <strong className="font-bold">Lưu ý: </strong>
            <span className="block sm:inline">{translationError}</span>
          </div>
        )}
      </div>

      <div className="flex-grow border border-slate-200 dark:border-slate-700 rounded-lg overflow-y-auto p-2 space-y-1">
        <label className="flex items-start cursor-pointer p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50">
            <input
                type="checkbox"
                id="select-all"
                checked={allSelected}
                onChange={handleToggleAll}
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-[--color-accent-600] focus:ring-[--color-accent-600] mt-0.5 dark:bg-slate-800 dark:checked:bg-[--color-accent-600]"
            />
            <span className="ml-3 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'} ({selectedCount}/{allHeadingsTexts.length})
            </span>
        </label>
        <hr className="border-slate-200 dark:border-slate-700 !my-2"/>
        {tree.map(node => (
            <TocNodeComponent 
                key={node.text}
                node={node}
                selected={selected}
                translations={translations}
                onToggle={handleToggle}
                descendantTextMap={descendantTextMap}
            />
        ))}
      </div>

      <div className="flex-shrink-0 pt-6 flex flex-col sm:flex-row justify-end items-center gap-3">
        <button
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded-md border border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 text-slate-700 bg-white dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600 dark:focus:ring-slate-500 transition-colors"
        >
            Hủy
        </button>
        <button
            onClick={() => onSummarize(['all'])}
            disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md border border-transparent text-[--color-accent-600] dark:text-[--color-accent-400] hover:bg-[--color-accent-500]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--color-accent-500] transition-colors"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>Đang tạo...</span>
            </>
          ) : (
            <span>Tóm tắt toàn bộ</span>
          )}
        </button>
        <button
            onClick={handleSummarizeSelectedClick}
            disabled={isLoading || selectedCount === 0}
            className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center px-5 py-2.5 bg-[--color-accent-600] text-white font-semibold rounded-md shadow-sm hover:bg-[--color-accent-700] disabled:bg-slate-400 disabled:dark:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--color-accent-500]"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>Đang tạo...</span>
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 mr-2" />
              <span>{summarizeButtonText}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};