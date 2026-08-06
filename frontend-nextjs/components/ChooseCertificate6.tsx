'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Upload, File, Image, FileText, Trash } from 'lucide-react';

interface TemplateFile {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
  uploadedAt: Date;
}

export default function ChooseCertificate() {
  const [templateFiles, setTemplateFiles] = useState<TemplateFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);

    for (const file of files) {
      const newFile: TemplateFile = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        uploadedAt: new Date(),
      };
      
      setTemplateFiles(prev => [newFile, ...prev]);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setIsUploading(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setTemplateFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file: TemplateFile) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-500" />;
    }
    if (file.type === 'application/pdf') {
      return <FileText className="h-4 w-4 text-red-500" />;
    }
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const hasFiles = templateFiles.length > 0;

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto border rounded-xl p-3 sm:p-4 gap-4">
      {/* Header Section - Fixed */}
      <div className='flex-shrink-0 flex flex-col gap-2'>
        <div className='font-semibold text-gray-800'>Upload Certificate Template</div>
        <div className='text-sm text-gray-800'>
          Upload your certificate template (PDF, PNG, JPG, JPEG)
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload Button - Fixed */}
        <div className="flex-shrink-0">
          <Button 
            onClick={handleButtonClick}
            disabled={isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isUploading ? 'Uploading...' : 'Choose Template Files'}
          </Button>
        </div>

        {/* Uploaded Files List - Scrollable */}
        {hasFiles && (
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <div className="flex-shrink-0 flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">
                Uploaded Templates ({templateFiles.length})
              </h4>
            </div>
            
            {/* Scrollable list container */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
              <div className="flex flex-col gap-2">
                {templateFiles.map((file) => (
                  <div 
                    key={file.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 sm:px-4 sm:py-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                        {getFileIcon(file)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span>{file.size}</span>
                          <span>•</span>
                          <span>{file.type.split('/')[1]?.toUpperCase() || 'Unknown'}</span>
                          <span>•</span>
                          <span className="text-blue-500 whitespace-nowrap">
                            {formatTimeAgo(file.uploadedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className='flex-shrink-0 flex gap-2 sm:gap-4'>
                      <Button size="sm" variant="outline">
                        Use
                      </Button>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}