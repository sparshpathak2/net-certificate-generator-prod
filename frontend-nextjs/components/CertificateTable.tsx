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
import { 
    ChevronLeft, 
    ChevronRight, 
    ChevronsLeft, 
    ChevronsRight,
    Download,
    Eye,
    MoreHorizontal,
    Copy
} from "lucide-react";
import toast from "react-hot-toast";

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
}

export function CertificateTable({ data, isLoading }: CertificateTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    const columns: ColumnDef<CertificateItem>[] = [
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
                            <DropdownMenuItem
                                onClick={() => {
                                    const verifyUrl = `${window.location.origin}/verify/${certificate.uniqueCode}`;
                                    copyToClipboard(verifyUrl);
                                }}
                            >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Verification Link
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => window.open(`/verify/${certificate.uniqueCode}`, "_blank")}
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                View Certificate
                            </DropdownMenuItem>
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
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
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
                                <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
        </div>
    );
}