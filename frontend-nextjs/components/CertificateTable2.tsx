"use client";

import { useState } from "react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
    ChevronLeft, 
    ChevronRight, 
    ChevronsLeft, 
    ChevronsRight,
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
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [rowSelection, setRowSelection] = useState({});
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    const getSelectedRows = () => {
        return table.getSelectedRowModel().rows.map(row => row.original);
    };

    const getSelectedIds = () => {
        return getSelectedRows().map(row => row.id);
    };

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
        const selectedRows = getSelectedRows();
        const recipients = selectedRows.filter(r => r.recipientEmail);
        
        if (recipients.length === 0) {
            toast.error("No certificates with email addresses selected");
            return;
        }
        
        onBulkEmail?.(getSelectedIds());
    };

    const handleBulkDelete = () => {
        const selectedIds = getSelectedIds();
        if (selectedIds.length === 0) {
            toast.error("No certificates selected");
            return;
        }
        setShowDeleteDialog(true);
    };

    const confirmBulkDelete = () => {
        onBulkDelete?.(getSelectedIds());
        setRowSelection({});
        setShowDeleteDialog(false);
    };

    const columns: ColumnDef<CertificateItem>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableGlobalFilter: false,
        },
        {
            accessorKey: "recipientName",
            header: "Recipient Name",
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue("recipientName")}</div>
            ),
        },
        {
            accessorKey: "recipientEmail",
            header: "Email",
            cell: ({ row }) => row.getValue("recipientEmail") || "—",
        },
        {
            accessorKey: "uniqueCode",
            header: "Certificate Code",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                        {row.getValue("uniqueCode")}
                    </code>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(row.getValue("uniqueCode"))}
                    >
                        <Copy className="h-3 w-3" />
                    </Button>
                </div>
            ),
        },
        {
            accessorKey: "batchTitle",
            header: "Batch",
            cell: ({ row }) => row.getValue("batchTitle") || "—",
        },
        {
            accessorKey: "templateName",
            header: "Template",
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.getValue("templateName") || "—"}
                </span>
            ),
        },
        {
            accessorKey: "issuedAt",
            header: "Issued Date",
            cell: ({ row }) => {
                const date = row.getValue("issuedAt") as string;
                return date ? new Date(date).toLocaleDateString() : "—";
            },
        },
        {
            accessorKey: "isIssued",
            header: "Status",
            cell: ({ row }) => (
                <Badge variant={row.getValue("isIssued") ? "default" : "secondary"}>
                    {row.getValue("isIssued") ? "Issued" : "Pending"}
                </Badge>
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const certificate = row.original;
                const verifyUrl = `${window.location.origin}/verify/${certificate.uniqueCode}`;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => window.open(certificate.downloadUrl, "_blank")}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                            </DropdownMenuItem>
                            {/* <DropdownMenuItem
                                onClick={() => copyToClipboard(verifyUrl)}
                            >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Verification Link
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => window.open(verifyUrl, "_blank")}
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                View Certificate
                            </DropdownMenuItem> */}
                            {certificate.recipientEmail && (
                                <DropdownMenuItem
                                    onClick={() => {
                                        window.location.href = `mailto:${certificate.recipientEmail}?subject=Your Certificate&body=Here is your certificate: ${verifyUrl}`;
                                    }}
                                >
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send Email
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            globalFilter,
            rowSelection,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    const selectedCount = Object.keys(rowSelection).length;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

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
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                />
                <div className="text-sm text-muted-foreground">
                    Total: {data.length} certificates
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef.header,
                                                  header.getContext()
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow 
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className={row.getIsSelected() ? "bg-primary/5" : ""}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No certificates found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                        Page {table.getState().pagination.pageIndex + 1} of{" "}
                        {table.getPageCount()}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
                <select
                    className="border rounded-md px-2 py-1 text-sm"
                    value={table.getState().pagination.pageSize}
                    onChange={(e) => table.setPageSize(Number(e.target.value))}
                >
                    {[10, 20, 30, 50].map((pageSize) => (
                        <option key={pageSize} value={pageSize}>
                            Show {pageSize}
                        </option>
                    ))}
                </select>
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