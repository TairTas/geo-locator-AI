
import React from 'react';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div className="w-full bg-gray-600 rounded-full h-1.5 overflow-hidden">
      <div
        className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-linear"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;
