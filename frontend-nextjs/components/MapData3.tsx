"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet, Settings, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Field {
  id: string;
  name: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  text: string;
  align: string;
  bold: boolean;
  italic: boolean;
}

interface MapDataProps {
  templateId: string;
  fields: Field[];
  onGenerate: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
}

export function MapData({
  templateId,
  fields,
  onGenerate,
  children,
}: MapDataProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setExcelFile(file);
      toast.success(`File "${file.name}" uploaded successfully`);
    }
  };

  const handleGenerate = async () => {
    if (!excelFile) {
      toast.error("Please upload an Excel file");
      return;
    }

    const unmappedFields = fields.filter((field) => !fieldMapping[field.name]);
    if (unmappedFields.length > 0) {
      toast.error(
        `Please map all fields: ${unmappedFields.map((f) => f.name).join(", ")}`,
      );
      return;
    }

    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append("excel", excelFile);
      formData.append("templateId", templateId);
      formData.append("fields", JSON.stringify(fields));
      formData.append("fieldMapping", JSON.stringify(fieldMapping));

      await onGenerate(formData);
      setIsOpen(false);
      setExcelFile(null);
      setFieldMapping({});
      setActiveTab("upload");
    } catch (error) {
      console.error("Generation failed:", error);
      toast.error("Failed to generate certificates");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="bottom"
        className="!h-[90vh] !max-h-[90vh] p-0"
        style={{ height: "90vh", maxHeight: "90vh" }}
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="p-4 border-b shrink-0">
            <SheetTitle className="text-lg font-semibold">
              Generate Certificates
            </SheetTitle>
            <SheetDescription>
              Upload Excel file and map fields to generate certificates in bulk
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col items-center w-full">
            <div className="flex-1 overflow-y-auto p-4 w-full max-w-4xl">
              <div className="space-y-6">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload" className="gap-2">
                      <Upload size={16} />
                      Select Data
                    </TabsTrigger>
                    <TabsTrigger
                      value="map"
                      className="gap-2"
                      disabled={!excelFile}
                    >
                      <FileSpreadsheet size={16} />
                      Map Fields
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="mt-4 space-y-4">
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="excel-upload"
                      />
                      <label
                        htmlFor="excel-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload size={40} className="text-gray-400" />
                        <span className="text-sm font-medium">
                          {excelFile
                            ? excelFile.name
                            : "Click to upload Excel file"}
                        </span>
                        <span className="text-xs text-gray-500">
                          Supports .xlsx, .xls, .csv
                        </span>
                      </label>
                    </div>

                    {excelFile && (
                      <Button
                        onClick={() => setActiveTab("map")}
                        className="w-full"
                      >
                        Continue to Field Mapping
                      </Button>
                    )}
                  </TabsContent>

                  <TabsContent value="map" className="mt-4 space-y-4">
                    <div className="space-y-4">
                      <h3 className="font-medium">
                        Map Template Fields to Excel Columns
                      </h3>
                      <p className="text-sm text-gray-500">
                        Map each template field to the corresponding column in
                        your Excel file
                      </p>
                      {fields.map((field) => (
                        <div
                          key={field.id}
                          className="grid grid-cols-2 gap-4 items-center"
                        >
                          <Label className="font-medium">{field.name}</Label>
                          <Input
                            placeholder="Excel column name"
                            value={fieldMapping[field.name] || ""}
                            onChange={(e) =>
                              setFieldMapping({
                                ...fieldMapping,
                                [field.name]: e.target.value,
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("upload")}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex-1 gap-2"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Settings size={16} />
                            Generate Certificates
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
