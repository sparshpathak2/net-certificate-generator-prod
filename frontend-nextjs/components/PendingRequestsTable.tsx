"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useGetAllTemplates } from "@/hooks/useTemplates";
import { Loader2, CheckCircle, XCircle, Eye, MoreHorizontal, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api-client";
import { useGetPendingRequests } from "@/hooks/useCertificates";

interface PendingRequest {
  id: string;
  requestId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  studentId?: string;
  courseName: string;
  completionDate?: string;
  department?: string;
  additionalInfo?: string;
  status: string;
  templateId?: string;
  createdAt: string;
}

interface PendingRequestsTableProps {
  onRefresh?: () => void;
}

export function PendingRequestsTable({ onRefresh }: PendingRequestsTableProps) {
  const { data, isLoading, error, refetch } = useGetPendingRequests();
  const { data: templatesData } = useGetAllTemplates();
  const [searchTerm, setSearchTerm] = useState("");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showBulkRejectDialog, setShowBulkRejectDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isBulkAction, setIsBulkAction] = useState(false);
  const [bulkTemplateId, setBulkTemplateId] = useState("");
  const [bulkRejectionReason, setBulkRejectionReason] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const requests = data?.requests || [];
  
  const filteredRequests = requests.filter((request: PendingRequest) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      request.studentName.toLowerCase().includes(searchLower) ||
      request.studentEmail.toLowerCase().includes(searchLower) ||
      request.courseName.toLowerCase().includes(searchLower) ||
      (request.studentId && request.studentId.toLowerCase().includes(searchLower))
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedRequests = filteredRequests.filter((_, index) => {
    const globalIndex = (currentPage - 1) * itemsPerPage + index;
    return rowSelection[globalIndex];
  });
  const selectedCount = selectedRequests.length;
  const selectedIds = selectedRequests.map(r => r.id);

  const handleSelectAll = () => {
    if (Object.keys(rowSelection).length === filteredRequests.length) {
      setRowSelection({});
    } else {
      const newSelection: Record<string, boolean> = {};
      filteredRequests.forEach((_, index) => {
        newSelection[index] = true;
      });
      setRowSelection(newSelection);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Clear selection when changing page
    setRowSelection({});
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
    setRowSelection({});
  };

  const handleApprove = async (requestId: string, templateId: string) => {
    setApprovingId(requestId);
    try {
      await apiClient.post(`/admin/requests/${requestId}/approve`, { templateId });
      toast.success("Request approved successfully!");
      refetch();
      onRefresh?.();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve request");
    } finally {
      setApprovingId(null);
      setShowApproveDialog(false);
    }
  };

  const handleReject = async (requestId: string) => {
    setRejectingId(requestId);
    try {
      await apiClient.post(`/admin/requests/${requestId}/reject`, {
        rejectionReason: rejectionReason || "Request rejected by admin"
      });
      toast.success("Request rejected successfully!");
      refetch();
      onRefresh?.();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    } finally {
      setRejectingId(null);
      setShowRejectDialog(false);
      setRejectionReason("");
    }
  };

  const handleBulkApprove = async () => {
    if (!bulkTemplateId) {
      toast.error("Please select a template");
      return;
    }
    
    setIsBulkAction(true);
    let successCount = 0;
    let failCount = 0;
    
    for (const requestId of selectedIds) {
      try {
        await apiClient.post(`/admin/requests/${requestId}/approve`, { templateId: bulkTemplateId });
        successCount++;
      } catch (error) {
        console.error(`Error approving request ${requestId}:`, error);
        failCount++;
      }
    }
    
    toast.success(`Approved ${successCount} requests${failCount > 0 ? `, ${failCount} failed` : ''}`);
    setRowSelection({});
    setShowApproveDialog(false);
    setBulkTemplateId("");
    refetch();
    onRefresh?.();
    setIsBulkAction(false);
  };

  const handleBulkReject = async () => {
    setIsBulkAction(true);
    let successCount = 0;
    let failCount = 0;
    
    for (const requestId of selectedIds) {
      try {
        await apiClient.post(`/admin/requests/${requestId}/reject`, {
          rejectionReason: bulkRejectionReason || "Request rejected by admin"
        });
        successCount++;
      } catch (error) {
        console.error(`Error rejecting request ${requestId}:`, error);
        failCount++;
      }
    }
    
    toast.success(`Rejected ${successCount} requests${failCount > 0 ? `, ${failCount} failed` : ''}`);
    setRowSelection({});
    setShowBulkRejectDialog(false);
    setBulkRejectionReason("");
    refetch();
    onRefresh?.();
    setIsBulkAction(false);
  };

  const openApproveDialog = (request?: PendingRequest) => {
    if (request) {
      setSelectedRequest(request);
      setSelectedTemplate(request.templateId || "");
      setShowApproveDialog(true);
    } else if (selectedCount > 0) {
      setShowApproveDialog(true);
    }
  };

  const openRejectDialog = (request?: PendingRequest) => {
    if (request) {
      setSelectedRequest(request);
      setRejectionReason("");
      setShowRejectDialog(true);
    } else if (selectedCount > 0) {
      setShowBulkRejectDialog(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        Failed to load pending requests
      </div>
    );
  }

  if (filteredRequests.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        {searchTerm ? "No matching requests found" : "No pending requests"}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Bulk Actions Bar */}
        {selectedCount > 0 && (
          <div className="bg-primary/10 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedCount} request{selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openApproveDialog()}
                className="gap-2 text-green-600"
              >
                <CheckCircle className="h-4 w-4" />
                Approve Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openRejectDialog()}
                className="gap-2 text-red-600"
              >
                <XCircle className="h-4 w-4" />
                Reject Selected
              </Button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, course, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 max-w-sm"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Total: {filteredRequests.length} pending requests
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      Object.keys(rowSelection).length === filteredRequests.length &&
                      filteredRequests.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.map((request: PendingRequest, index: number) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + index;
                return (
                  <TableRow 
                    key={request.id}
                    data-state={rowSelection[globalIndex] && "selected"}
                    className={rowSelection[globalIndex] ? "bg-primary/5" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={rowSelection[globalIndex] || false}
                        onCheckedChange={(checked) => {
                          setRowSelection(prev => ({
                            ...prev,
                            [globalIndex]: checked === true
                          }));
                        }}
                        aria-label="Select row"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{request.studentName}</TableCell>
                    <TableCell>{request.studentEmail}</TableCell>
                    <TableCell>{request.courseName}</TableCell>
                    <TableCell>{request.department || "—"}</TableCell>
                    <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-500">Pending</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openApproveDialog(request)}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openRejectDialog(request)}>
                            <XCircle className="mr-2 h-4 w-4 text-red-600" />
                            Reject
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`/admin/requests/${request.id}`, "_blank")}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
          <select
            className="border rounded-md px-2 py-1 text-sm"
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(e.target.value)}
          >
            {[10, 20, 30, 50].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Single Approve Dialog */}
      <Dialog open={showApproveDialog && !!selectedRequest && !isBulkAction} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Request</DialogTitle>
            <DialogDescription>
              Approve certificate request for {selectedRequest?.studentName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {templatesData?.templates?.map((template: any) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.originalName || template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleApprove(selectedRequest?.id, selectedTemplate)} 
              disabled={approvingId === selectedRequest?.id || !selectedTemplate}
              className="bg-green-600"
            >
              {approvingId === selectedRequest?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Reject Dialog */}
      <Dialog open={showRejectDialog && !!selectedRequest && !isBulkAction} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedRequest?.studentName}'s request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleReject(selectedRequest?.id)} 
              disabled={rejectingId === selectedRequest?.id}
              variant="destructive"
            >
              {rejectingId === selectedRequest?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Approve Dialog */}
      <Dialog open={showApproveDialog && !selectedRequest && selectedCount > 0} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Approve Requests</DialogTitle>
            <DialogDescription>
              Approve {selectedCount} selected request{selectedCount !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Template for All</Label>
              <Select value={bulkTemplateId} onValueChange={setBulkTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {templatesData?.templates?.map((template: any) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.originalName || template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkApprove} 
              disabled={isBulkAction || !bulkTemplateId}
              className="bg-green-600"
            >
              {isBulkAction ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject Dialog */}
      <AlertDialog open={showBulkRejectDialog} onOpenChange={setShowBulkRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Reject Requests</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject {selectedCount} selected request{selectedCount !== 1 ? 's' : ''}?
              {selectedCount > 0 && (
                <ul className="mt-2 max-h-40 overflow-auto text-sm">
                  {selectedRequests.slice(0, 5).map(r => (
                    <li key={r.id}>• {r.studentName} - {r.courseName}</li>
                  ))}
                  {selectedCount > 5 && <li>• and {selectedCount - 5} more...</li>}
                </ul>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Rejection reason (optional)"
              value={bulkRejectionReason}
              onChange={(e) => setBulkRejectionReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkReject} 
              disabled={isBulkAction}
              className="bg-red-600 hover:bg-red-700"
            >
              {isBulkAction ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Reject All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}