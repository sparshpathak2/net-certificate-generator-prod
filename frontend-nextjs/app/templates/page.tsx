"use client"

import AvatarComponent from "@/components/AvatarComponent";
import ChooseCertificate from "@/components/ChooseCertificate11";
import { MinimalFileUpload } from "@/components/MinimalFileUpload";
import { SessionContext } from "@/components/SessionProvider";
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useContext } from "react";

export default function Page() {

  const { user } = useContext(SessionContext);

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
      <SidebarInset>
        <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 bg-background border-b px-3">
          <div className="flex flex-1 items-center gap-2">
            <SidebarTrigger />
            <h1 className="font-semibold">Templates</h1>
            {/* <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1">
                    Project Management & Task Tracking
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb> */}
          </div>
          <div>
            {/* <NavUser user={userData.user} /> */}
            <AvatarComponent user={user} />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4">
          {/* <div className="mx-auto h-24 w-full max-w-3xl rounded-xl bg-muted/50" /> */}
          <ChooseCertificate />
          {/* <MinimalFileUpload /> */}
          {/* <div className="mx-auto h-[100vh] w-full max-w-3xl rounded-xl bg-muted/50" /> */}
        </div>
      </SidebarInset>
      {/* <SidebarRight /> */}
    </SidebarProvider>
  );
}
