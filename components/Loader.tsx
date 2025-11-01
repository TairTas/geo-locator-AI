
import React from 'react';
import ProgressBar from './ProgressBar';

interface LoaderProps {
  message: string;
  progress?: number;
}

const Loader: React.FC<LoaderProps> = ({ message, progress }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/80 rounded-lg backdrop-blur-sm z-10 p-4">
      <svg className="animate-spin h-10 w-10 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="mt-4 text-center text-gray-300 text-md">{message}</p>
      {progress !== undefined && (
        <div className="w-full max-w-xs mt-4">
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">{progress}%</span>
            </div>
            <ProgressBar progress={progress} />
        </div>
      )}
    </div>
  );
};

export default Loader;
