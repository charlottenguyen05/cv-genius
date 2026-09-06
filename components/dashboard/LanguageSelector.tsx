import React from 'react';

interface LanguageSelectorProps {
  value: 'fr' | 'en';
  onChange: (value: 'fr' | 'en') => void;
}

export default function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <div className="flex flex-col space-y-2 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100" data-testid="language-selector-section">
      <h3 className="text-lg font-bold text-gray-900 tracking-tight" data-testid="language-selector-title">
        Langue du CV généré
      </h3>
      <p className="text-sm text-gray-500 mb-4" data-testid="language-selector-description">
        Choisissez la langue dans laquelle votre CV sera rédigé par l&apos;IA.
      </p>
      
      <div className="flex items-center space-x-4 bg-surface-tint p-2 rounded-xl self-start border border-gray-100">
        <button
          type="button"
          onClick={() => onChange('fr')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            value === 'fr'
              ? 'bg-white text-primary-700 shadow-sm border border-primary-100'
              : 'text-gray-500 hover:bg-white/60'
          }`}
          data-testid="lang-fr-btn"
        >
          Français
        </button>
        
        <button
          type="button"
          onClick={() => onChange('en')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            value === 'en'
              ? 'bg-white text-primary-700 shadow-sm border border-primary-100'
              : 'text-gray-500 hover:bg-white/60'
          }`}
          data-testid="lang-en-btn"
        >
          English
        </button>
      </div>
    </div>
  );
}
