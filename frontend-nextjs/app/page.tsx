"use client";

import Image from "next/image";
import { FileBadge } from "lucide-react";
import AvatarComponent from "@/components/AvatarComponent";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

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

  // Handle navigation to templates
  const handleCardClick = () => {
    router.push("/templates");
  };

  return (
    <>
      <div className="flex border-b h-14 items-center justify-between pr-3 pl-2 py-3">
        <div className="flex items-center gap-2">
          <Image
            className="dark:invert h-12 w-auto object-contain"
            src="/Navodaya-Logo.png"
            alt="Navodaya Education Trust"
            width={40}
            height={20}
            priority
          />
          <div className="font-semibold text-gray-400">|</div>
          <div className="font-semibold text-sm sm:text-base">
            Navodaya Software Center
          </div>
        </div>
        <AvatarComponent user={userData.user} />
      </div>
      {/* <div className="grid grid-cols-2 sm:grid-cols-3 py-4 px-4 sm:py-[8%] mx-auto gap-4 sm:gap-8"> */}
      <div className="grid grid-cols-1 py-4 px-4 sm:py-[8%] mx-auto gap-4 sm:gap-8">
        <div
          className="flex flex-col gap-2 items-center justify-center px-2 sm:px-6 py-3 sm:py-4 border-2 border-gray-500 rounded-xl"
          onClick={handleCardClick}
        >
          <FileBadge size={48} />
          <div className="flex justify-center text-center font-semibold text-sm sm:text-[16px]">
            Certificate Generator
          </div>
        </div>
        {/* <div className="flex flex-col gap-2 items-center justify-center px-2 py-2 sm:py-4 border-2 border-gray-500 rounded-xl">
          <FileBadge size={48} />
          <div className="flex justify-center text-center font-semibold text-sm sm:text-[16px]">Certificate Generator</div>
        </div>
        <div className="flex flex-col gap-2 items-center justify-center px-2 py-2 sm:py-4 border-2 border-gray-500 rounded-xl">
          <FileBadge size={48} />
          <div className="flex justify-center text-center font-semibold text-sm sm:text-[16px]">Certificate Generator</div>
        </div> */}
      </div>
    </>
  );
}
