"use client";

import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent } from "@/components/ui/card";
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
import { MapData } from "./MapData5";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface TextField {
  id: string;
  name: string;
  // x, y are ALWAYS stored in PDF point space (bottom-left origin)
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  text: string;
  align: "left" | "center" | "right";
  bold: boolean;
  italic: boolean;
  // Actual PDF point dimensions at time of save — used by backend for rescaling guard
  pdfWidth?: number;
  pdfHeight?: number;
}

interface TemplateEditorProps {
  templateUrl: string;
  templateId: string;
  onSave?: (fields: TextField[]) => Promise<void>;
  onGenerate?: (data: FormData) => Promise<void>;
  initialFields?: TextField[];
  isSaving?: boolean;
}

export function TemplateEditor({
  templateUrl,
  templateId,
  onSave,
  onGenerate,
  initialFields = [],
  isSaving = false,
}: TemplateEditorProps) {
  const [fields, setFields] = useState<TextField[]>(initialFields);
  const [lastSavedFields, setLastSavedFields] = useState<TextField[]>(initialFields);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isPdfLoaded, setIsPdfLoaded] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isLocalSaving, setIsLocalSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // pdfPointDimensions: the actual PDF size in points (what pdf-lib uses)
  // e.g. A4 landscape = 841.89 x 595.28 pt
  const [pdfPointDimensions, setPdfPointDimensions] = useState({ width: 0, height: 0 });

  // pageDimensions: the rendered pixel size of the PDF in the browser at scale=1
  // react-pdf at scale=1 renders 1pt → 1px, so these are usually equal to pdfPointDimensions
  // BUT some PDFs have a rotation or user-unit that makes them differ — track separately
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });

  const isInitialized = useRef(false);
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

  // Initialise fields from props exactly once
  useEffect(() => {
    if (!isInitialized.current && initialFields.length > 0) {
      setFields(initialFields);
      setLastSavedFields(initialFields);
      isInitialized.current = true;
    }
  }, [initialFields]);

  // ─── PDF load handlers ────────────────────────────────────────────────────

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setIsPdfLoaded(true);
    console.log("PDF loaded, pages:", numPages);
  };

  const onPageLoadSuccess = (page: any) => {
    // originalWidth/Height = unscaled PDF point dimensions (what pdf-lib sees)
    const ptW = page.originalWidth;
    const ptH = page.originalHeight;
    setPdfPointDimensions({ width: ptW, height: ptH });

    // viewport at scale=1 gives the rendered pixel size
    const vp = page.getViewport({ scale: 1 });
    setPageDimensions({ width: vp.width, height: vp.height });

    console.log(`PDF points: ${ptW} x ${ptH}`);
    console.log(`Rendered px: ${vp.width} x ${vp.height}`);
  };

  // ─── Image load handlers ──────────────────────────────────────────────────

  const onImageLoad = () => {
    if (!imageRef.current) return;
    const w = imageRef.current.naturalWidth;
    const h = imageRef.current.naturalHeight;
    // For images, "PDF points" and rendered pixels are the same concept —
    // we treat pixel coordinates as the stored coordinate space (no Y flip needed
    // because we use canvas drawing, which is also top-left origin)
    setPdfPointDimensions({ width: w, height: h });
    setPageDimensions({ width: w, height: h });
    setIsImageLoaded(true);
    console.log("Image loaded:", w, h);
  };

  // Redraws the canvas overlay for image templates
  const drawImageWithFields = () => {
    if (!canvasRef.current || !imageRef.current || !pageDimensions.width) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = pageDimensions.width;
    canvas.height = pageDimensions.height;
    ctx.drawImage(imageRef.current, 0, 0, pageDimensions.width, pageDimensions.height);

    fields.forEach((field) => {
      // For images, stored y is top-left origin (canvas), draw directly
      let fontStyle = "";
      if (field.italic) fontStyle += "italic ";
      if (field.bold) fontStyle += "bold ";
      fontStyle += `${field.fontSize}px ${field.fontFamily}`;
      ctx.font = fontStyle;
      ctx.fillStyle = field.color;

      const metrics = ctx.measureText(field.text || field.name);
      let drawX = field.x;
      if (field.align === "center") drawX = field.x - metrics.width / 2;
      else if (field.align === "right") drawX = field.x - metrics.width;

      ctx.fillText(field.text || field.name, drawX, field.y);

      if (selectedFieldId === field.id) {
        ctx.strokeStyle = "#0066ff";
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX - 2, field.y - field.fontSize + 4, metrics.width + 4, field.fontSize + 4);
        ctx.fillStyle = "#0066ff";
        ctx.fillRect(field.x - 4, field.y - 4, 8, 8);
      }
    });
  };

  useEffect(() => {
    if (isImage && isImageLoaded && pageDimensions.width > 0) {
      drawImageWithFields();
    }
  }, [fields, selectedFieldId, isImage, isImageLoaded, pageDimensions]);

  // ─── Coordinate conversion helpers ───────────────────────────────────────

  /**
   * Converts a mouse event position into PDF point coordinates.
   *
   * The overlay div sits at the top-left of the rendered PDF canvas.
   * containerRef wraps the rendered PDF at its natural rendered pixel size.
   *
   * For PDFs:
   *   - Scale display pixels → PDF points via the ratio pdfPoints/renderedPx
   *   - Flip Y: PDF origin is bottom-left, browser is top-left
   *     pdfY = pdfPointHeight - (displayY * scaleY)
   *
   * For images:
   *   - No Y flip needed (canvas is also top-left)
   *   - Scale display pixels → natural image pixels
   */
  const getCoordinates = (e: React.MouseEvent): { x: number; y: number } | null => {
    const container = containerRef.current;
    if (!container || !pdfPointDimensions.width) return null;

    // Bounding rect of the rendered PDF/image element
    // We need the rect of the PDF page itself, not the outer scroll container.
    // containerRef wraps the page directly, so getBoundingClientRect is correct.
    const rect = container.getBoundingClientRect();

    // Click position in display pixels relative to the rendered content top-left
    const displayX = e.clientX - rect.left;
    const displayY = e.clientY - rect.top;

    // Scale factors: how many PDF points per rendered pixel
    // pageDimensions = rendered pixel size; pdfPointDimensions = PDF point size
    const scaleX = pdfPointDimensions.width / pageDimensions.width;
    const scaleY = pdfPointDimensions.height / pageDimensions.height;

    const pdfX = displayX * scaleX;

    let pdfY: number;
    if (isPdf) {
      // PDF: flip Y axis (pdf-lib bottom-left origin)
      pdfY = pdfPointDimensions.height - displayY * scaleY;
    } else {
      // Image: canvas is top-left, no flip
      pdfY = displayY * scaleY;
    }

    return { x: pdfX, y: pdfY };
  };

  /**
   * Converts a stored PDF-point coordinate back to display pixels for overlay positioning.
   *
   * For PDFs: flip Y back (stored y is from bottom, CSS top is from top)
   * For images: no flip needed
   */
  const toDisplayCoords = (field: TextField): { x: number; y: number; fontSize: number } => {
    if (!pdfPointDimensions.width || !pageDimensions.width) {
      return { x: field.x, y: field.y, fontSize: field.fontSize };
    }

    const scaleX = pageDimensions.width / pdfPointDimensions.width;
    const scaleY = pageDimensions.height / pdfPointDimensions.height;

    const displayX = field.x * scaleX;
    const displayY = isPdf
      ? (pdfPointDimensions.height - field.y) * scaleY  // flip Y for PDF
      : field.y * scaleY;                                 // no flip for image

    // Scale font size to match zoom level so preview matches output
    const displayFontSize = field.fontSize * scaleX;

    return { x: displayX, y: displayY, fontSize: displayFontSize };
  };

  // ─── Field management ─────────────────────────────────────────────────────

  const addTextField = () => {
    // Place new field in the centre, in PDF point space
    const cx = pdfPointDimensions.width / 2 || 400;
    const cy = pdfPointDimensions.height / 2 || 300;

    const newField: TextField = {
      id: Date.now().toString(),
      name: `Field ${fields.length + 1}`,
      x: cx,
      y: cy,
      fontSize: 24,
      fontFamily: "Helvetica",
      color: "#000000",
      text: `Field ${fields.length + 1}`,
      align: "center",
      bold: false,
      italic: false,
    };
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (updates: Partial<TextField>) => {
    if (!selectedFieldId) return;
    setFields((prev) =>
      prev.map((f) => (f.id === selectedFieldId ? { ...f, ...updates } : f))
    );
  };

  const deleteField = () => {
    if (!selectedFieldId) return;
    setFields((prev) => prev.filter((f) => f.id !== selectedFieldId));
    setSelectedFieldId(null);
  };

  // ─── Mouse interaction handlers ───────────────────────────────────────────

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't deselect mid-drag
    if (isDragging) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    // Find the topmost field near the click point (in PDF point space)
    const hit = [...fields].reverse().find((field) => {
      const dx = Math.abs(coords.x - field.x);
      const dy = Math.abs(coords.y - field.y);
      return dx < 80 && dy < 40;
    });

    setSelectedFieldId(hit?.id ?? null);
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const coords = getCoordinates(e);
    if (!coords) return;

    const newField: TextField = {
      id: Date.now().toString(),
      name: `Field ${fields.length + 1}`,
      x: coords.x,
      y: coords.y,
      fontSize: 24,
      fontFamily: "Helvetica",
      color: "#000000",
      text: `Field ${fields.length + 1}`,
      align: "center",
      bold: false,
      italic: false,
      pdfWidth: pdfPointDimensions.width,
      pdfHeight: pdfPointDimensions.height,
    };
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
    toast.success("Field added at cursor position");
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedFieldId) return;
    const coords = getCoordinates(e);
    if (!coords) return;
    const field = fields.find((f) => f.id === selectedFieldId);
    if (field) {
      setDragOffset({ x: coords.x - field.x, y: coords.y - field.y });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !selectedFieldId) return;
    const coords = getCoordinates(e);
    if (!coords) return;
    setFields((prev) =>
      prev.map((f) =>
        f.id === selectedFieldId
          ? { ...f, x: coords.x - dragOffset.x, y: coords.y - dragOffset.y }
          : f
      )
    );
  };

  const handleMouseUp = () => setIsDragging(false);

  // ─── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!onSave) return;
    // Attach current PDF point dimensions so backend can detect template mismatches
    const fieldsToSave = fields.map((field) => ({
      ...field,
      pdfWidth: pdfPointDimensions.width,
      pdfHeight: pdfPointDimensions.height,
    }));
    setIsLocalSaving(true);
    try {
      await onSave(fieldsToSave);
      setLastSavedFields(fieldsToSave);
      toast.success("Template saved successfully!");
    } catch {
      toast.error("Failed to save template");
    } finally {
      setIsLocalSaving(false);
    }
  };

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderPdf = () => (
    <>
      <Document
        file={templateUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(err) => console.error("PDF load error:", err)}
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
          Loading image...
        </div>
      )}
    </>
  );

  const hasUnsavedChanges = JSON.stringify(fields) !== JSON.stringify(lastSavedFields);
  const hasAnySavedFields = lastSavedFields.length > 0;

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full min-h-0 gap-4">
      {/* ── Left: template viewer + field overlay ── */}
      <div
        className="flex-1 min-h-0 border rounded-lg overflow-auto bg-gray-100 p-4 relative"
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <div
          ref={containerRef}
          className="relative mx-auto"
          style={{ width: "fit-content", minHeight: "500px" }}
        >
          {isPdf && renderPdf()}
          {isImage && renderImage()}

          {/* Field overlays — positioned in display pixel space */}
          {isPdfLoaded && pageDimensions.width > 0 && (
            <div
              className="absolute top-0 left-0"
              style={{
                width: pageDimensions.width,
                height: pageDimensions.height,
                pointerEvents: "none",
              }}
            >
              {fields.map((field) => {
                const dp = toDisplayCoords(field);
                return (
                  <div
                    key={field.id}
                    className={`absolute select-none ${
                      selectedFieldId === field.id
                        ? "outline outline-2 outline-blue-500"
                        : "outline outline-1 outline-dashed outline-gray-400"
                    }`}
                    style={{
                      left: dp.x,
                      top: dp.y,
                      // Shift up by font size so the anchor point (bottom-left baseline)
                      // visually matches where pdf-lib will draw the text
                      transform: `translateY(-${dp.fontSize}px)${
                        field.align === "center" ? " translateX(-50%)" : ""
                      }`,
                      fontSize: dp.fontSize,
                      fontFamily: field.fontFamily,
                      color: field.color,
                      fontWeight: field.bold ? "bold" : "normal",
                      fontStyle: field.italic ? "italic" : "normal",
                      pointerEvents: "auto",
                      cursor: isDragging ? "grabbing" : "grab",
                      whiteSpace: "nowrap",
                      lineHeight: 1,
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setSelectedFieldId(field.id);
                      const coords = getCoordinates(e as any);
                      if (coords) {
                        setDragOffset({ x: coords.x - field.x, y: coords.y - field.y });
                        setIsDragging(true);
                      }
                    }}
                  >
                    {field.text || field.name}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: fields panel ── */}
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
            {fields.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Type className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No fields added yet</p>
                <p className="text-sm">Click "Add Field" or double-click on the template</p>
              </div>
            )}

            {fields.map((field) => (
              <div
                key={field.id}
                className={`cursor-pointer transition-all rounded-lg border-2 ${
                  selectedFieldId === field.id
                    ? "border-blue-500 ring-2 ring-blue-500"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onClick={() => setSelectedFieldId(field.id)}
              >
                <div className="p-3 pb-0 flex justify-between items-center">
                  <p className="text-base font-semibold">{field.name}</p>
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
                <CardContent className="p-3 pt-1">
                  <div className="text-xs text-gray-500 space-y-0.5">
                    {/* Show PDF point coordinates to the user for transparency */}
                    <div>Position (PDF pts): ({Math.round(field.x)}, {Math.round(field.y)})</div>
                    <div>Font: {field.fontSize}pt · {field.fontFamily}</div>
                  </div>
                </CardContent>
              </div>
            ))}

            {/* Field property editor */}
            {selectedField && (
              <div className="flex flex-col border-t gap-3 pt-3">
                <h3 className="font-medium">Edit Field</h3>

                <div className="flex flex-col gap-2">
                  <Label>Field Name</Label>
                  <Input
                    value={selectedField.name}
                    onChange={(e) => updateField({ name: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Preview Text</Label>
                  <Input
                    value={selectedField.text}
                    onChange={(e) => updateField({ text: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-2">
                    <Label>X (PDF pts)</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedField.x)}
                      onChange={(e) => updateField({ x: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Y (PDF pts)</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedField.y)}
                      onChange={(e) => updateField({ y: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-2">
                    <Label>Font Size (pt)</Label>
                    <Input
                      type="number"
                      value={selectedField.fontSize}
                      onChange={(e) => updateField({ fontSize: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Font Family</Label>
                    <select
                      className="w-full border rounded-md p-2 text-sm"
                      value={selectedField.fontFamily}
                      onChange={(e) => updateField({ fontFamily: e.target.value })}
                    >
                      <option value="Helvetica">Helvetica</option>
                      <option value="Helvetica-Bold">Helvetica Bold</option>
                      <option value="Times-Roman">Times Roman</option>
                      <option value="Courier">Courier</option>
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
                      className="w-16 px-1 py-1"
                    />
                    <Input
                      type="text"
                      value={selectedField.color}
                      onChange={(e) => updateField({ color: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Alignment</Label>
                  <div className="flex gap-1">
                    {(["left", "center", "right"] as const).map((a) => (
                      <Button
                        key={a}
                        variant={selectedField.align === a ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateField({ align: a })}
                        className="flex-1"
                      >
                        {a === "left" && <AlignLeft size={14} />}
                        {a === "center" && <AlignCenter size={14} />}
                        {a === "right" && <AlignRight size={14} />}
                      </Button>
                    ))}
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
            {isSaving || isLocalSaving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save size={16} /> Save Template</>
            )}
          </Button>

          <MapData templateId={templateId} fields={fields}>
            <Button
              className="w-full gap-2"
              disabled={!hasAnySavedFields || hasUnsavedChanges || isSaving || isLocalSaving}
            >
              <Upload size={16} />
              Generate Certificates
            </Button>
          </MapData>
        </div>
      </div>
    </div>
  );
}