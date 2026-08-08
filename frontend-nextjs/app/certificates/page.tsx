"use client";

import { useContext, useState } from "react";
import { CertificateTable } from "@/components/CertificateTable2";
import { SidebarLeft } from "@/components/sidebar-left";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PendingRequestsTable } from "@/components/PendingRequestsTable";
import {
  useGetAllCertificateItems,
  useGetPendingRequests,
} from "@/hooks/useCertificates";
import { Loader2, RefreshCw } from "lucide-react";
import { NavUser } from "@/components/nav-user";
import AvatarComponent from "@/components/AvatarComponent";
import { SessionContext } from "@/components/SessionProvider";

export default function CertificatesPage() {
  const {
    data,
    isLoading,
    error,
    refetch: refetchCertificates,
  } = useGetAllCertificateItems();
  const { data: pendingData, refetch: refetchPending } =
    useGetPendingRequests();
  const [activeTab, setActiveTab] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useContext(SessionContext);

  const certificates = data?.certificates || [];
  const pendingCount = pendingData?.count || 0;

  const refreshData = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchCertificates(), refetchPending()]);
    setIsRefreshing(false);
  };

  if (isLoading && activeTab === "all") {
    return (
      <SidebarProvider>
        <SidebarLeft />
        <SidebarInset>
          <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 bg-background border-b">
            <div className="flex flex-1 items-center gap-2 px-3">
              <SidebarTrigger />
              <h1 className="font-semibold">Certificates</h1>
            </div>
          </header>
          <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error && activeTab === "all") {
    return (
      <SidebarProvider>
        <SidebarLeft />
        <SidebarInset>
          <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 bg-background border-b">
            <div className="flex flex-1 items-center gap-2 px-3">
              <SidebarTrigger />
              <h1 className="font-semibold">Certificates</h1>
            </div>
          </header>
          <div className="text-center text-red-500 py-8">
            Failed to load certificates
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // This is sample data.
  const userData = {
    user: {
      name: "shadcn",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    calendars: [
      {
        name: "My Calendars",
        items: ["Personal", "Work", "Family"],
      },
      {
        name: "Favorites",
        items: ["Holidays", "Birthdays"],
      },
      {
        name: "Other",
        items: ["Travel", "Reminders", "Deadlines"],
      },
    ],
  };

  return (
    <SidebarProvider>
      <SidebarLeft />
      <SidebarInset className="h-screen flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <header className="flex h-14 shrink-0 items-center gap-2 bg-background border-b px-3">
          <SidebarTrigger />
          <h1 className="font-semibold">Certificates</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
            className="ml-auto"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Refresh
          </Button>
          {/* <div className="p-2 borter-t"> */}
          <div>
            {/* <NavUser user={userData.user} /> */}
            <AvatarComponent user={user} />
          </div>
        </header>

        <div className="flex-shrink-0 px-4 pt-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="inline-block"
          >
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="all" className="gap-2">
                All Certificates
                <Badge variant="secondary" className="ml-1">
                  {certificates.length}
                </Badge>
              </TabsTrigger>
              {/* <TabsTrigger value="pending" className="gap-2">
                Pending Requests
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger> */}
            </TabsList>
          </Tabs>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="all" className="mt-0">
              <CertificateTable data={certificates} isLoading={isLoading} />
            </TabsContent>
            {/* <TabsContent value="pending" className="mt-0">
              <PendingRequestsTable onRefresh={refreshData} />
            </TabsContent> */}
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
