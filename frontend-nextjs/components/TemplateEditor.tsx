"use client";

import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Trash2, 
  Type, 
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Save,
  Loader2
} from "lucide-react";

// ✅ Set up PDF.js worker correctly for Next.js
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface TextField {
  id: string;
  name: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  text: string;
  align: "left" | "center" | "right";
  bold: boolean;
  italic: boolean;
}

interface TemplateEditorProps {
  templateUrl: string;
  onSave?: (fields: TextField[]) => void;
  initialFields?: TextField[];
}

export function TemplateEditor({ 
  templateUrl, 
  onSave, 
  initialFields = [] 
}: TemplateEditorProps) {
  const [fields, setFields] = useState<TextField[]>(initialFields);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [isPdfLoaded, setIsPdfLoaded] = useState(false);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedField = fields.find(f => f.id === selectedFieldId);
  const isPdf = templateUrl?.includes('.pdf');

  // Handle PDF load success
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsPdfLoaded(true);
    console.log("PDF loaded successfully, pages:", numPages);
  };

  // Handle page dimensions
  const onPageLoadSuccess = (page: any) => {
    const viewport = page.getViewport({ scale: 1 });
    const width = viewport.width;
    const height = viewport.height;
    setPageDimensions({ width, height });
  };

  // Add new text field at center
  const addTextField = () => {
    const newField: TextField = {
      id: Date.now().toString(),
      name: `Field ${fields.length + 1}`,
      x: pageDimensions.width / 2 || 400,
      y: pageDimensions.height / 2 || 300,
      fontSize: 24,
      fontFamily: "Arial",
      color: "#000000",
      text: `Field ${fields.length + 1}`,
      align: "center",
      bold: false,
      italic: false,
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  // Update field property
  const updateField = (updates: Partial<TextField>) => {
    if (!selectedFieldId) return;
    setFields(fields.map(f => f.id === selectedFieldId ? { ...f, ...updates } : f));
  };

  // Delete field
  const deleteField = () => {
    if (selectedFieldId) {
      setFields(fields.filter(f => f.id !== selectedFieldId));
      setSelectedFieldId(null);
    }
  };

  // Get canvas coordinates
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    
    const scaleX = pageDimensions.width / rect.width;
    const scaleY = pageDimensions.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Handle click to select field
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    const clickedField = [...fields].reverse().find((field) => {
      return Math.abs(coords.x - field.x) < 50 && Math.abs(coords.y - field.y) < 30;
    });

    setSelectedFieldId(clickedField?.id || null);
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !selectedFieldId) return;
    
    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    setFields(fields.map(f => 
      f.id === selectedFieldId 
        ? { ...f, x: coords.x - dragOffset.x, y: coords.y - dragOffset.y }
        : f
    ));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedFieldId) return;
    
    const coords = getCanvasCoordinates(e);
    if (!coords) return;
    
    const field = fields.find(f => f.id === selectedFieldId);
    if (field) {
      setDragOffset({ x: coords.x - field.x, y: coords.y - field.y });
      setIsDragging(true);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex h-full min-h-0 gap-4">
      {/* Left Side - Template Viewer */}
      <div 
        // className="flex-1 border rounded-lg overflow-auto bg-gray-100 p-4 relative"
        className="flex-1 min-h-0 border rounded-lg overflow-auto bg-gray-100 p-4 relative"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <div ref={containerRef} className="relative mx-auto" style={{ width: '100%', minHeight: '500px' }}>
          <Document
            file={templateUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => console.error("PDF load error:", error)}
          >
            {isPdfLoaded && (
              <Page
                pageNumber={1}
                scale={1}
                onLoadSuccess={onPageLoadSuccess}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            )}
          </Document>
          
          {/* Render fields overlay */}
          {isPdfLoaded && pageDimensions.width > 0 && (
            <div 
              className="absolute top-0 left-0"
              style={{ 
                width: pageDimensions.width, 
                height: pageDimensions.height,
                pointerEvents: 'none'
              }}
            >
              {fields.map((field) => (
                <div
                  key={field.id}
                  className={`absolute cursor-move ${selectedFieldId === field.id ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: field.x,
                    top: field.y,
                    fontSize: field.fontSize,
                    fontFamily: field.fontFamily,
                    color: field.color,
                    fontWeight: field.bold ? 'bold' : 'normal',
                    fontStyle: field.italic ? 'italic' : 'normal',
                    textAlign: field.align,
                    transform: field.align === 'center' ? 'translateX(-50%)' : 'none',
                    pointerEvents: 'auto',
                    cursor: 'grab',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedFieldId(field.id);
                    const coords = getCanvasCoordinates(e as any);
                    if (coords) {
                      setDragOffset({ x: coords.x - field.x, y: coords.y - field.y });
                      setIsDragging(true);
                    }
                  }}
                >
                  {field.text || field.name}
                </div>
              ))}
            </div>
          )}
          
          {!isPdfLoaded && (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              Loading PDF...
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Fields Panel */}
      {/* <div className="w-96 border-l bg-white"> */}
        <div className="w-96 flex flex-col border-l bg-white">
        {/* <div className="p-4 border-b"> */}
        <div className="flex-shrink-0 p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-lg">Template Fields</h2>
            <Button onClick={addTextField} size="sm" className="gap-1">
              <Plus size={16} />
              Add Field
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {fields.length} field{fields.length !== 1 ? 's' : ''} added
          </p>
        </div>

        {/* <ScrollArea className="h-[calc(100vh-120px)]"> */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4">
            {/* Fields List */}
            {fields.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Type className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No fields added yet</p>
                <p className="text-sm">Click "Add Field" to start</p>
              </div>
            )}

            {fields.map((field) => (
              <Card 
                key={field.id}
                className={`cursor-pointer transition-all ${
                  selectedFieldId === field.id 
                    ? "ring-2 ring-blue-500 border-blue-500" 
                    : "hover:border-gray-400"
                }`}
                onClick={() => setSelectedFieldId(field.id)}
              >
                <CardHeader className="p-3 pb-0">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium">{field.name}</CardTitle>
                    {selectedFieldId === field.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); deleteField(); }}
                        className="h-7 w-7 p-0 text-red-500"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-2">
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Position: ({Math.round(field.x)}, {Math.round(field.y)})</div>
                    <div>Font: {field.fontSize}px {field.fontFamily}</div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Field Properties Editor */}
            {selectedField && (
              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-3">Edit Field Properties</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Field Name</Label>
                    <Input
                      value={selectedField.name}
                      onChange={(e) => updateField({ name: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label>Text Content</Label>
                    <Input
                      value={selectedField.text}
                      onChange={(e) => updateField({ text: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>X Position</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedField.x)}
                        onChange={(e) => updateField({ x: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Y Position</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedField.y)}
                        onChange={(e) => updateField({ y: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Font Size</Label>
                      <Input
                        type="number"
                        value={selectedField.fontSize}
                        onChange={(e) => updateField({ fontSize: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Font Family</Label>
                      <select
                        className="w-full border rounded-md p-2 text-sm"
                        value={selectedField.fontFamily}
                        onChange={(e) => updateField({ fontFamily: e.target.value })}
                      >
                        <option>Arial</option>
                        <option>Helvetica</option>
                        <option>Times New Roman</option>
                        <option>Courier New</option>
                        <option>Georgia</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={selectedField.color}
                        onChange={(e) => updateField({ color: e.target.value })}
                        className="w-16"
                      />
                      <Input
                        type="text"
                        value={selectedField.color}
                        onChange={(e) => updateField({ color: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Text Alignment</Label>
                    <div className="flex gap-1 mt-1">
                      <Button
                        variant={selectedField.align === "left" ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateField({ align: "left" })}
                      >
                        <AlignLeft size={14} />
                      </Button>
                      <Button
                        variant={selectedField.align === "center" ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateField({ align: "center" })}
                      >
                        <AlignCenter size={14} />
                      </Button>
                      <Button
                        variant={selectedField.align === "right" ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateField({ align: "right" })}
                      >
                        <AlignRight size={14} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={selectedField.bold ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateField({ bold: !selectedField.bold })}
                      className="flex-1"
                    >
                      <Bold size={14} className="mr-1" /> Bold
                    </Button>
                    <Button
                      variant={selectedField.italic ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateField({ italic: !selectedField.italic })}
                      className="flex-1"
                    >
                      <Italic size={14} className="mr-1" /> Italic
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <Button onClick={() => onSave?.(fields)} className="w-full gap-2">
            <Save size={16} />
            Save Template Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}