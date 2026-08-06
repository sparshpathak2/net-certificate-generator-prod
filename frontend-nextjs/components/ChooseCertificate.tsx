'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { FileUpload } from './FileUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Upload, LayoutTemplate, FileText } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

export default function ChooseCertificate() {
  const [activeTab, setActiveTab] = useState('excel');

  const handleExcelUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post('/api/upload/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast.success('Excel file uploaded successfully!', {
        description: `${response.data.rowCount} records found`,
      });
      
      return response.data;
    } catch (error) {
      toast.error('Failed to upload Excel file');
      throw error;
    }
  };

  const handleTemplateUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('template', file);
    
    try {
      const response = await axios.post('/api/upload/template', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast.success('Template uploaded successfully!');
      return response.data;
    } catch (error) {
      toast.error('Failed to upload template');
      throw error;
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Choose Certificate Files</CardTitle>
        <CardDescription>
          Upload your Excel data file and certificate template
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="excel" className="gap-2">
              <FileText className="h-4 w-4" />
              Excel Data
            </TabsTrigger>
            <TabsTrigger value="template" className="gap-2">
              <LayoutTemplate className="h-4 w-4" />
              Certificate Template
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="excel" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Upload your Excel file (.xlsx, .xls, .csv) containing certificate data
            </div>
            <FileUpload
              onFileUpload={handleExcelUpload}
              accept=".xlsx,.xls,.csv"
              buttonText="Upload Excel File"
            />
          </TabsContent>
          
          <TabsContent value="template" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Upload your certificate template (PDF, PNG, JPG)
            </div>
            <FileUpload
              onFileUpload={handleTemplateUpload}
              accept=".pdf,.png,.jpg,.jpeg"
              buttonText="Upload Template"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}