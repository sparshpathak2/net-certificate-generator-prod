"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    Download,
    Eye,
    MoreHorizontal,
    Copy,
    Mail,
    Trash2,
    FileDown
} from "lucide-react";
import toast from "react-hot-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CertificateItem {
    id: string;
    recipientName: string;
    recipientEmail: string | null;
    uniqueCode: string;
    downloadUrl: string;
    isIssued: boolean;
    issuedAt: string;
    createdAt: string;
    batchTitle?: string;
    templateName?: string;
}

interface CertificateTableProps {
    data: CertificateItem[];
    isLoading?: boolean;
    onBulkDownload?: (selectedIds: string[]) => void;
    onBulkEmail?: (selectedIds: string[]) => void;
    onBulkDelete?: (selectedIds: string[]) => void;
}

export function CertificateTable({ 
    data, 
    isLoading, 
    onBulkDownload,
    onBulkEmail,
    onBulkDelete 
}: CertificateTableProps) {
    const [globalFilter, setGlobalFilter] = useState("");
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    const toggleSelectAll = () => {
        if (selectedRows.size === filteredData.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(filteredData.map(item => item.id)));
        }
    };

    const toggleSelectRow = (id: string) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedRows(newSelected);
    };

    const getSelectedIds = () => Array.from(selectedRows);

    const handleBulkDownload = () => {
        const selectedIds = getSelectedIds();
        if (selectedIds.length === 0) {
            toast.error("No certificates selected");
            return;
        }
        toast.loading(`Downloading ${selectedIds.length} certificates...`);
        onBulkDownload?.(selectedIds);
    };

    const handleBulkEmail = () => {
        const selectedItems = filteredData.filter(item => selectedRows.has(item.id));
        const recipients = selectedItems.filter(r => r.recipientEmail);
        
        if (recipients.length === 0) {
            toast.error("No certificates with email addresses selected");
            return;
        }
        
        onBulkEmail?.(getSelectedIds());
    };

    const handleBulkDelete = () => {
        if (selectedRows.size === 0) {
            toast.error("No certificates selected");
            return;
        }
        setShowDeleteDialog(true);
    };

    const confirmBulkDelete = () => {
        onBulkDelete?.(getSelectedIds());
        setSelectedRows(new Set());
        setShowDeleteDialog(false);
    };

    // Filter data based on search
    const filteredData = data.filter(item => {
        if (!globalFilter) return true;
        const searchLower = globalFilter.toLowerCase();
        return (
            item.recipientName.toLowerCase().includes(searchLower) ||
            (item.recipientEmail?.toLowerCase().includes(searchLower)) ||
            item.uniqueCode.toLowerCase().includes(searchLower)
        );
    });

    const selectedCount = selectedRows.size;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Define column widths
    const leftFixedWidth = 250; // checkbox (50) + name (200)
    const rightFixedWidth = 80; // actions
    
    const scrollableColumns = [
        { key: "recipientEmail", label: "Email", width: 180 },
        { key: "uniqueCode", label: "Certificate Code", width: 250 },
        { key: "batchTitle", label: "Batch", width: 150 },
        { key: "templateName", label: "Template", width: 150 },
        { key: "issuedAt", label: "Issued Date", width: 120 },
        { key: "isIssued", label: "Status", width: 100 },
    ];
    
    const totalScrollableWidth = scrollableColumns.reduce((sum, col) => sum + col.width, 0);

    return (
        <div className="space-y-4">
            {/* Bulk Actions Bar */}
            {selectedCount > 0 && (
                <div className="bg-primary/10 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                            {selectedCount} certificate{selectedCount !== 1 ? 's' : ''} selected
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkDownload}
                            className="gap-2"
                        >
                            <FileDown className="h-4 w-4" />
                            Download All
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkEmail}
                            className="gap-2"
                        >
                            <Mail className="h-4 w-4" />
                            Email Selected
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="flex items-center justify-between">
                <Input
                    placeholder="Search by name, code, or email..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                />
                <div className="text-sm text-muted-foreground">
                    Total: {filteredData.length} certificates
                </div>
            </div>

            {/* Table Container - Single horizontal scroll for all rows */}
            <div className="rounded-md border overflow-hidden bg-white">
                {/* Header Row - Fixed left and right, scrollable middle */}
                <div className="flex border-b bg-muted/50">
                    {/* Left Fixed Header */}
                    <div className="flex-shrink-0 border-r border-gray-200 bg-muted/50" style={{ width: leftFixedWidth }}>
                        <div className="flex">
                            <div className="w-[50px] h-12 px-4 flex items-center">
                                <Checkbox
                                    checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                                    onCheckedChange={toggleSelectAll}
                                    aria-label="Select all"
                                />
                            </div>
                            <div className="w-[200px] h-12 px-4 flex items-center font-medium">Recipient Name</div>
                        </div>
                    </div>
                    
                    {/* Scrollable Header - SINGLE scrollable container */}
                    <div className="flex-1 overflow-x-auto">
                        <div className="flex bg-muted/50" style={{ minWidth: totalScrollableWidth }}>
                            {scrollableColumns.map((col) => (
                                <div key={col.key} className="px-4 py-3 font-medium" style={{ width: col.width }}>
                                    {col.label}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Right Fixed Header */}
                    <div className="flex-shrink-0 border-l border-gray-200 bg-muted/50" style={{ width: rightFixedWidth }}>
                        <div className="h-12 px-4 flex items-center font-medium">Actions</div>
                    </div>
                </div>

                {/* Data Rows - All rows share the same scrollable container */}
                <div className="divide-y">
                    {filteredData.map((item) => (
                        <div key={item.id} className="flex">
                            {/* Left Fixed Cells */}
                            <div className="flex-shrink-0 border-r border-gray-200 bg-white" style={{ width: leftFixedWidth }}>
                                <div className="flex h-16">
                                    <div className="w-[50px] px-4 flex items-center">
                                        <Checkbox
                                            checked={selectedRows.has(item.id)}
                                            onCheckedChange={() => toggleSelectRow(item.id)}
                                            aria-label="Select row"
                                        />
                                    </div>
                                    <div className="w-[200px] px-4 flex items-center font-medium">
                                        {item.recipientName}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Scrollable Cells - NO overflow-x-auto here, just the content */}
                            <div className="flex-1">
                                <div className="flex bg-white" style={{ minWidth: totalScrollableWidth }}>
                                    <div className="px-4 py-4 flex items-center" style={{ width: 180 }}>
                                        {item.recipientEmail || "—"}
                                    </div>
                                    <div className="px-4 py-4 flex items-center gap-2" style={{ width: 250 }}>
                                        <code className="text-xs bg-muted px-2 py-1 rounded">
                                            {item.uniqueCode}
                                        </code>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => copyToClipboard(item.uniqueCode)}
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <div className="px-4 py-4 flex items-center" style={{ width: 150 }}>
                                        {item.batchTitle || "—"}
                                    </div>
                                    <div className="px-4 py-4 flex items-center" style={{ width: 150 }}>
                                        <span className="text-sm text-muted-foreground">
                                            {item.templateName || "—"}
                                        </span>
                                    </div>
                                    <div className="px-4 py-4 flex items-center" style={{ width: 120 }}>
                                        {new Date(item.issuedAt).toLocaleDateString()}
                                    </div>
                                    <div className="px-4 py-4 flex items-center" style={{ width: 100 }}>
                                        <Badge variant={item.isIssued ? "default" : "secondary"}>
                                            {item.isIssued ? "Issued" : "Pending"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Right Fixed Cells */}
                            <div className="flex-shrink-0 border-l border-gray-200 bg-white" style={{ width: rightFixedWidth }}>
                                <div className="h-16 px-4 flex items-center">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem
                                                onClick={() => window.open(item.downloadUrl, "_blank")}
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Download PDF
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => copyToClipboard(`${window.location.origin}/verify/${item.uniqueCode}`)}
                                            >
                                                <Copy className="mr-2 h-4 w-4" />
                                                Copy Verification Link
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => window.open(`/verify/${item.uniqueCode}`, "_blank")}
                                            >
                                                <Eye className="mr-2 h-4 w-4" />
                                                View Certificate
                                            </DropdownMenuItem>
                                            {item.recipientEmail && (
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        window.location.href = `mailto:${item.recipientEmail}?subject=Your Certificate&body=Here is your certificate: ${window.location.origin}/verify/${item.uniqueCode}`;
                                                    }}
                                                >
                                                    <Mail className="mr-2 h-4 w-4" />
                                                    Send Email
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredData.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-muted-foreground">
                        No certificates found.
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Showing {filteredData.length} of {data.length} certificates
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete {selectedCount} selected certificate{selectedCount !== 1 ? 's' : ''}. 
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}