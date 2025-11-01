
import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  filePreview: string | null;
  fileType: string | undefined;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, filePreview, fileType }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileChange(e.dataTransfer.files[0]);
    }
  }, [onFileChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(e.target.files[0]);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      className={`relative border-2 border-dashed rounded-lg p-4 w-full h-64 flex flex-col justify-center items-center text-center transition-colors duration-300
        ${isDragging ? 'border-blue-400 bg-gray-700' : 'border-gray-600 bg-gray-700/50'}`}
    >
      <input
        type="file"
        id="file-upload"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileSelect}
        accept="image/*,video/*"
      />
      {filePreview ? (
        fileType?.startsWith('video/') ? (
          <video src={filePreview} controls className="absolute inset-0 w-full h-full object-cover rounded-lg" />
        ) : (
          <img src={filePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
        )
      ) : (
        <div className="flex flex-col items-center text-gray-400 pointer-events-none">
          <UploadCloud size={48} className="mb-4 text-gray-500" />
          <p className="font-semibold">
            <span className="text-blue-400">Click to upload</span> or drag and drop
          </p>
          <p className="text-sm">Image or Video</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
