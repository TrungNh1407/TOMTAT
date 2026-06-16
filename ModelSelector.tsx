import React, { useState, useEffect } from 'react';
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
  'gemini-3.5-flash': 'Gemini 3.5 Flash',
  'gemini-3.1-pro-preview': 'Gemini 3.1 Pro Preview',
  'gemini-3.1-flash-lite': 'Gemini 3.1 Flash Lite',
  // DeepSeek
  'deepseek-v4-flash': 'DeepSeek v4 Flash',
  'deepseek-v4-pro': 'DeepSeek v4 Pro',
  'deepseek-chat': 'DeepSeek Chat',
  'deepseek-reasoner': 'DeepSeek Reasoner',
  // Perplexity
  'sonar': 'Sonar',
  'sonar-pro': 'Sonar Pro',
  'sonar-reasoning': 'Sonar Reasoning',
  'sonar-reasoning-pro': 'Sonar Reasoning Pro',
  'sonar-deep-research': 'Sonar Deep Research',
  // Virouter
  'claude-haiku-4-5-20251001': 'Claude 4.5 Haiku',
  'claude-sonnet-4-6': 'Claude 4.6 Sonnet',
  'claude-opus-4-8': 'Claude 4.8 Opus',
  'gpt-5.4-mini': 'GPT 5.4 Mini',
  'gpt-5.4': 'GPT 5.4',
  'gpt-5.5': 'GPT 5.5',
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  availableModels,
  disabled,
}) => {
  const [providerStatus, setProviderStatus] = useState<{ [key: string]: { configured: boolean, valid: boolean } } | null>(null);

  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => setProviderStatus(data))
      .catch(err => console.error("Failed to fetch provider status:", err));
  }, []);

  const provider = Object.keys(availableModels).find(p => availableModels[p].includes(selectedModel)) || 'Google';
  const Icon = provider === 'Perplexity' ? PerplexityIcon : CpuChipIcon;

  const getStatusIndicator = (providerName: string) => {
    if (!providerStatus) return '';
    const status = providerStatus[providerName];
    if (!status) return '';
    if (!status.configured) return ' (⚠️ Thiếu Key)';
    if (!status.valid) return ' (🔴 Lỗi Key/Offline)';
    return ' (🟢 Sẵn sàng)';
  };

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
            const indicator = getStatusIndicator(providerName);
            return (
              <optgroup label={`${providerName}${indicator}`} key={providerName}>
                {models.map((model) => (
                  <option key={model} value={model}>
                    {modelDisplayNames[model] || model} {indicator}
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