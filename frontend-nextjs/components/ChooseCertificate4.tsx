'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LayoutTemplate, CheckCircle, Trash2, Upload, File, Image, FileText, X, Trash } from 'lucide-react';

interface TemplateFile {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
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

    // Process each file
    for (const file of files) {
      const newFile: TemplateFile = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
      };
      
      setTemplateFiles(prev => [...prev, newFile]);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setIsUploading(false);
    
    // Reset input
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

  const hasFiles = templateFiles.length > 0;

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto border rounded-xl p-3 sm:p-4 gap-4">
      <div className='flex flex-col gap-2'>
        <div className='font-semibold text-gray-800'>Upload Certificate Template</div>
        <div className='text-sm text-gray-800'>
          Upload your certificate template (PDF, PNG, JPG, JPEG)
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload Button */}
        <div>
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

        {/* Uploaded Files List */}
        {hasFiles && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">
                Uploaded Templates ({templateFiles.length})
              </h4>
              {/* {templateFiles.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTemplateFiles([])}
                  className="text-red-600 hover:text-red-700 h-8"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Clear All
                </Button>
              )} */}
            </div>
            
            <div className="flex flex-col gap-2">
              {templateFiles.map((file) => (
                <div 
                  key={file.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 sm:px-4 sm:py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                      {getFileIcon(file)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.size} • {file.type.split('/')[1]?.toUpperCase() || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className='flex gap-2 sm:gap-4'>
                    <Button size="sm">Use</Button>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                  {/* <Button
                  variant="outline"
                  size="sm"
                    onClick={() => removeFile(file.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash className="h-4 w-4" />
                  </Button> */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generate Button */}
        {/* {hasFiles && (
          <div className="flex justify-center pt-4">
            <Button 
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" />
              Generate Certificates
            </Button>
          </div>
        )} */}
      </div>
    </div>
  );
}