import React, { createContext, useContext, useState } from 'react';

export const ModelContext = createContext();

export const ModelProvider = ({ children }) => {
  const [currentModel, setCurrentModel] = useState(import.meta.env.VITE_DEFAULT_LLM_MODEL);
  const [models, setModels] = useState([]);

  const resetModel = () => {
    setCurrentModel(import.meta.env.VITE_DEFAULT_LLM_MODEL);
  };

  // Get the context limit for the currently selected model
  const getModelLimit = () => {
    const model = models.find(m => m.id === currentModel);
    if (model && model.maxTokens) {
      const raw = model.maxTokens;
      // Handle numeric values
      if (typeof raw === 'number') return raw;
      // Handle string formats: "300k", "1M", "128000", "1,000,000", etc.
      const str = String(raw).trim().toLowerCase();
      if (str.endsWith('k')) {
        const num = parseFloat(str.slice(0, -1));
        if (!isNaN(num)) return Math.round(num * 1000);
      }
      if (str.endsWith('m')) {
        const num = parseFloat(str.slice(0, -1));
        if (!isNaN(num)) return Math.round(num * 1000000);
      }
      // Plain number (possibly with commas)
      const val = parseInt(str.replace(/,/g, ''), 10);
      if (!isNaN(val) && val > 0) {
        // Heuristic: if the value is suspiciously small (<1000), assume it's in thousands
        return val < 1000 ? val * 1000 : val;
      }
    }
    return null; // fallback handled by consumer
  };

  return (
    <ModelContext.Provider value={{ currentModel, setCurrentModel, resetModel, models, setModels, getModelLimit }}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = () => useContext(ModelContext);
