"use client";

import React, { useState } from 'react';
import { UploadIcon } from './Icons';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative group cursor-pointer transition-all duration-300 ease-in-out border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center h-48 ${
        isDragging
          ? 'border-pink-500 bg-pink-500/10 scale-[1.02]'
          : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:border-pink-400'
      }`}
    >
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="p-3 bg-gray-700 rounded-full mb-3 group-hover:bg-pink-600 transition-colors">
        <UploadIcon />
      </div>
      <p className="text-lg font-medium text-gray-300">
        Drop panels here or{' '}
        <span className="text-pink-400">click to browse</span>
      </p>
      <p className="text-sm text-gray-500 mt-1">Supports PNG, JPG, WEBP</p>
    </div>
  );
};
