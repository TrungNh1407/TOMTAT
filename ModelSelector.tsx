import React from 'react';
import { CpuChipIcon } from './icons/CpuChipIcon';
import { PerplexityIcon } from './icons/PerplexityIcon';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  availableModels: { [provider: string]: string[] };
  disabled: boolean;
}

const modelDisplayNames: { [key: string]: string } = {
  // Google
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
  // Perplexity
  'sonar': 'Sonar',
  'sonar-pro': 'Sonar Pro',
  'sonar-reasoning': 'Sonar Reasoning',
  'sonar-reasoning-pro': 'Sonar Reasoning Pro',
  'sonar-deep-research': 'Sonar Deep Research',
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  availableModels,
  disabled,
}) => {
  const provider = Object.keys(availableModels).find(p => availableModels[p].includes(selectedModel)) || 'Google';
  const Icon = provider === 'Perplexity' ? PerplexityIcon : CpuChipIcon;

  return (
    <div>
      <label htmlFor="model-selector" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 text-center sm:text-left">
        Mô hình AI
      </label>
      <div className="relative">
         <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Icon className="w-4 h-4 text-slate-500" />
         </div>
        <select
          id="model-selector"
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={disabled}
          className="block w-full rounded-md border-slate-300 dark:border-slate-600 pl-9 shadow-sm focus:border-[--color-accent-500] focus:ring-[--color-accent-500] sm:text-sm py-2 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-700/50 dark:bg-slate-900/50 dark:text-slate-200"
        >
          {Object.keys(availableModels).map((providerName) => {
            const models = availableModels[providerName];
            return (
              <optgroup label={providerName} key={providerName}>
                {models.map((model) => (
                  <option key={model} value={model}>
                    {modelDisplayNames[model] || model}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </div>
    </div>
  );
};