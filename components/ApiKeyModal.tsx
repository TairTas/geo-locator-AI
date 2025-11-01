import React, { useState } from 'react';
import { KeyRound, ExternalLink } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (apiKey: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave }) => {
  const [key, setKey] = useState('');

  const handleSave = () => {
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-8 w-full max-w-md m-4 transform transition-all animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-full">
                <KeyRound size={24} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Enter your Gemini API Key</h2>
        </div>
        <p className="text-gray-400 mb-6">
          To use this application, you need to provide your own Gemini API key. Your key is stored only in your browser.
        </p>
        <div className="mb-4">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter your API key here"
            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            aria-label="Gemini API Key"
          />
        </div>
         <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:underline mb-6"
        >
          Get your API key from Google AI Studio
          <ExternalLink size={14} />
        </a>
        <button
          onClick={handleSave}
          disabled={!key.trim()}
          className="w-full mt-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform transition-transform duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save and Continue
        </button>
      </div>
    </div>
  );
};

export default ApiKeyModal;