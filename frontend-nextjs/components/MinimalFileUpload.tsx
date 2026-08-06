'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

export function MinimalFileUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(selectedFiles);
    console.log('Selected files:', selectedFiles);
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button onClick={() => fileInputRef.current?.click()}>
        <Upload className="mr-2 h-4 w-4" />
        Upload Files
      </Button>

      {files.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          {files.length} file(s) selected
        </div>
      )}
    </div>
  );
}