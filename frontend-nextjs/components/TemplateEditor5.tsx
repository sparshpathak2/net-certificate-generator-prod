"use client";

import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
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
  Loader2,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";

// ✅ Set up PDF.js worker correctly for Next.js
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
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
  onSave?: (fields: TextField[]) => Promise<void>;
  onGenerate?: (fields: TextField[]) => void;
  initialFields?: TextField[];
  isSaving?: boolean;
  isSaveSuccess?: boolean;
}

export function TemplateEditor({
  templateUrl,
  onSave,
  onGenerate,
  initialFields = [],
  isSaving = false,
  isSaveSuccess = false,
}: TemplateEditorProps) {
  // ✅ Initialize state from initialFields only once, not on every change
  const [fields, setFields] = useState<TextField[]>(initialFields);
  const [savedFields, setSavedFields] = useState<TextField[]>(initialFields);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [isPdfLoaded, setIsPdfLoaded] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isLocalSaving, setIsLocalSaving] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectedField = fields.find((f) => f.id === selectedFieldId);
  const isPdf = templateUrl?.toLowerCase().includes(".pdf");
  const isImage =
    !isPdf &&
    (templateUrl?.toLowerCase().includes(".png") ||
      templateUrl?.toLowerCase().includes(".jpg") ||
      templateUrl?.toLowerCase().includes(".jpeg") ||
      templateUrl?.toLowerCase().includes(".gif") ||
      templateUrl?.toLowerCase().includes(".webp"));

  // ✅ Only update when save is successful from parent (refetch)
  useEffect(() => {
    if (isSaveSuccess && !isLocalSaving) {
      // Only update if there's a difference
      if (JSON.stringify(initialFields) !== JSON.stringify(savedFields)) {
        setSavedFields([...initialFields]);
      }
    }
  }, [isSaveSuccess, initialFields, isLocalSaving, savedFields]);

  // Handle PDF load success
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsPdfLoaded(true);
    console.log("PDF loaded successfully, pages:", numPages);
  };

  // Handle PDF page dimensions
  const onPageLoadSuccess = (page: any) => {
    const viewport = page.getViewport({ scale: 1 });
    const width = viewport.width;
    const height = viewport.height;
    setPageDimensions({ width, height });
  };

  // Handle image load
  const onImageLoad = () => {
    if (imageRef.current) {
      const width = imageRef.current.naturalWidth;
      const height = imageRef.current.naturalHeight;
      setPageDimensions({ width, height });
      setIsImageLoaded(true);
      console.log("Image loaded successfully, dimensions:", width, height);
      drawImageWithFields();
    }
  };

  // Draw image with fields overlay on canvas
  const drawImageWithFields = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = pageDimensions.width;
    canvas.height = pageDimensions.height;

    ctx.drawImage(
      imageRef.current,
      0,
      0,
      pageDimensions.width,
      pageDimensions.height,
    );

    fields.forEach((field) => {
      let fontStyle = "";
      if (field.italic) fontStyle += "italic ";
      if (field.bold) fontStyle += "bold ";
      fontStyle += `${field.fontSize}px ${field.fontFamily}`;
      ctx.font = fontStyle;
      ctx.fillStyle = field.color;

      let x = field.x;
      const metrics = ctx.measureText(field.text || field.name);

      if (field.align === "center") {
        x = field.x - metrics.width / 2;
      } else if (field.align === "right") {
        x = field.x - metrics.width;
      }

      ctx.fillText(field.text || field.name, x, field.y);

      if (selectedFieldId === field.id) {
        const width = metrics.width;
        const height = field.fontSize;

        ctx.strokeStyle = "#0066ff";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 2, field.y - height + 4, width + 4, height + 4);

        ctx.fillStyle = "#0066ff";
        ctx.fillRect(field.x - 6, field.y - 6, 8, 8);
      }
    });
  };

  useEffect(() => {
    if (isImage && isImageLoaded && pageDimensions.width > 0) {
      drawImageWithFields();
    }
  }, [fields, selectedFieldId, isImage, isImageLoaded, pageDimensions]);

  // Add new text field
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
    setFields(
      fields.map((f) => (f.id === selectedFieldId ? { ...f, ...updates } : f)),
    );
  };

  // Delete field
  const deleteField = () => {
    if (selectedFieldId) {
      setFields(fields.filter((f) => f.id !== selectedFieldId));
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
      return (
        Math.abs(coords.x - field.x) < 50 && Math.abs(coords.y - field.y) < 30
      );
    });

    setSelectedFieldId(clickedField?.id || null);
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !selectedFieldId) return;

    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    setFields(
      fields.map((f) =>
        f.id === selectedFieldId
          ? { ...f, x: coords.x - dragOffset.x, y: coords.y - dragOffset.y }
          : f,
      ),
    );
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedFieldId) return;

    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    const field = fields.find((f) => f.id === selectedFieldId);
    if (field) {
      setDragOffset({ x: coords.x - field.x, y: coords.y - field.y });
      setIsDragging(true);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Render PDF
  const renderPdf = () => (
    <>
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

      {!isPdfLoaded && (
        <div className="flex items-center justify-center h-96 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Loading PDF...
        </div>
      )}
    </>
  );

  // Render Image
  const renderImage = () => (
    <>
      <img
        ref={imageRef}
        src={templateUrl}
        alt="Template"
        className="hidden"
        onLoad={onImageLoad}
        onError={(e) => console.error("Image load error:", e)}
      />
      <canvas
        ref={canvasRef}
        className="block mx-auto"
        style={{ maxWidth: "100%", height: "auto" }}
      />
      {!isImageLoaded && (
        <div className="flex items-center justify-center h-96 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Loading Image...
        </div>
      )}
    </>
  );

  const hasUnsavedChanges =
    JSON.stringify(fields) !== JSON.stringify(savedFields);
  const hasAnySavedFields = savedFields.length > 0;

  const handleSave = async () => {
    if (!onSave) return;
    
    setIsLocalSaving(true);
    try {
      await onSave(fields);
      // After successful save, update savedFields immediately
      setSavedFields([...fields]);
      toast.success("Template saved successfully!");
    } catch (error) {
      toast.error("Failed to save template");
    } finally {
      setIsLocalSaving(false);
    }
  };

  const handleGenerateClick = () => {
    if (hasUnsavedChanges) {
      toast.error("Please save your changes before generating certificates");
      return;
    }

    if (!hasAnySavedFields) {
      toast.error("Please add at least one field to the template");
      return;
    }

    const loadingToast = toast.loading("Generating certificates...");
    
    try {
      onGenerate?.(fields);
      toast.success("Certificates generated successfully!", {
        id: loadingToast,
      });
    } catch (error) {
      toast.error("Failed to generate certificates", {
        id: loadingToast,
      });
    }
  };

  return (
    <div className="flex h-full min-h-0 gap-4">
      {/* Left Side - Template Viewer */}
      <div
        className="flex-1 min-h-0 border rounded-lg overflow-auto bg-gray-100 p-4 relative"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <div
          ref={containerRef}
          className="relative mx-auto"
          style={{ width: "100%", minHeight: "500px" }}
        >
          {isPdf && renderPdf()}
          {isImage && renderImage()}

          {/* Render fields overlay for PDF */}
          {isPdf && isPdfLoaded && pageDimensions.width > 0 && (
            <div
              className="absolute top-0 left-0"
              style={{
                width: pageDimensions.width,
                height: pageDimensions.height,
                pointerEvents: "none",
              }}
            >
              {fields.map((field) => (
                <div
                  key={field.id}
                  className={`absolute cursor-move ${selectedFieldId === field.id ? "ring-2 ring-blue-500" : ""}`}
                  style={{
                    left: field.x,
                    top: field.y,
                    fontSize: field.fontSize,
                    fontFamily: field.fontFamily,
                    color: field.color,
                    fontWeight: field.bold ? "bold" : "normal",
                    fontStyle: field.italic ? "italic" : "normal",
                    textAlign: field.align,
                    transform:
                      field.align === "center" ? "translateX(-50%)" : "none",
                    pointerEvents: "auto",
                    cursor: "grab",
                    whiteSpace: "nowrap",
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedFieldId(field.id);
                    const coords = getCanvasCoordinates(e as any);
                    if (coords) {
                      setDragOffset({
                        x: coords.x - field.x,
                        y: coords.y - field.y,
                      });
                      setIsDragging(true);
                    }
                  }}
                >
                  {field.text || field.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Fields Panel */}
      <div className="w-96 flex flex-col border-l bg-white">
        <div className="flex-shrink-0 p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-lg">Template Fields</h2>
            <Button onClick={addTextField} size="sm" className="gap-1">
              <Plus size={16} />
              Add Field
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {fields.length} field{fields.length !== 1 ? "s" : ""} added
          </p>
        </div>

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
              <div
                key={field.id}
                className={`cursor-pointer transition-all rounded-lg border-2 border-gray-300 ${
                  selectedFieldId === field.id
                    ? "border-blue-500 ring-2 ring-blue-500"
                    : " hover:border-gray-400"
                }`}
                onClick={() => setSelectedFieldId(field.id)}
              >
                <div className="p-3 pb-0">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-bold">{field.name}</p>
                    {selectedFieldId === field.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteField();
                        }}
                        className="h-7 w-7 p-0 text-red-500"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>
                <CardContent className="p-3 pt-2">
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>
                      Position: ({Math.round(field.x)}, {Math.round(field.y)})
                    </div>
                    <div>
                      Font: {field.fontSize}px {field.fontFamily}
                    </div>
                  </div>
                </CardContent>
              </div>
            ))}

            {/* Field Properties Editor */}
            {selectedField && (
              <div className="flex flex-col border-t gap-3">
                <h3 className="font-medium pt-3">Edit Field Properties</h3>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <Label>Field Name</Label>
                    <Input
                      value={selectedField.name}
                      onChange={(e) => updateField({ name: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Text Content</Label>
                    <Input
                      value={selectedField.text}
                      onChange={(e) => updateField({ text: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-2">
                      <Label>X Position</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedField.x)}
                        onChange={(e) =>
                          updateField({ x: parseInt(e.target.value) })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Y Position</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedField.y)}
                        onChange={(e) =>
                          updateField({ y: parseInt(e.target.value) })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-2">
                      <Label>Font Size</Label>
                      <Input
                        type="number"
                        value={selectedField.fontSize}
                        onChange={(e) =>
                          updateField({ fontSize: parseInt(e.target.value) })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Font Family</Label>
                      <select
                        className="w-full border rounded-md p-2 text-sm"
                        value={selectedField.fontFamily}
                        onChange={(e) =>
                          updateField({ fontFamily: e.target.value })
                        }
                      >
                        <option>Arial</option>
                        <option>Helvetica</option>
                        <option>Times New Roman</option>
                        <option>Courier New</option>
                        <option>Georgia</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
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

                  <div className="flex flex-col gap-2">
                    <Label>Text Alignment</Label>
                    <div className="flex gap-1 mt-1">
                      <Button
                        variant={
                          selectedField.align === "left" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => updateField({ align: "left" })}
                      >
                        <AlignLeft size={14} />
                      </Button>
                      <Button
                        variant={
                          selectedField.align === "center"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => updateField({ align: "center" })}
                      >
                        <AlignCenter size={14} />
                      </Button>
                      <Button
                        variant={
                          selectedField.align === "right"
                            ? "default"
                            : "outline"
                        }
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
                      onClick={() =>
                        updateField({ italic: !selectedField.italic })
                      }
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

        <div className="flex flex-col gap-2 p-4 border-t bg-white">
          <Button
            onClick={handleSave}
            className="w-full gap-2"
            variant="outline"
            disabled={isSaving || isLocalSaving}
          >
            {(isSaving || isLocalSaving) ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Template
              </>
            )}
          </Button>

          <Button
            onClick={handleGenerateClick}
            className="w-full gap-2"
            disabled={!hasAnySavedFields || hasUnsavedChanges || isSaving || isLocalSaving}
          >
            <Upload size={16} />
            Upload Data
          </Button>
        </div>
      </div>
    </div>
  );
}