"use client";

import * as React from "react";
import {
  AudioWaveform,
  Blocks,
  Calendar,
  Command,
  Home,
  Inbox,
  MessageCircleQuestion,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  LayoutTemplate,
  FileBadge,
} from "lucide-react";

import { NavFavorites } from "@/components/nav-favorites";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavWorkspaces } from "@/components/nav-workspaces";
import { TeamSwitcher } from "@/components/team-switcher";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";
import Image from "next/image";

// This is sample data.
const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: Command,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    // {
    //   title: "Search",
    //   url: "#",
    //   icon: Search,
    // },
    // {
    //   title: "Ask AI",
    //   url: "#",
    //   icon: Sparkles,
    // },
    {
      title: "Templates",
      url: "/templates",
      icon: LayoutTemplate,
      isActive: true,
    },
    {
      title: "Certificates",
      url: "/certificates",
      icon: FileBadge,
      badge: "10",
    },
  ],
  navSecondary: [
    // {
    //   title: "Calendar",
    //   url: "#",
    //   icon: Calendar,
    // },
    // {
    //   title: "Settings",
    //   url: "#",
    //   icon: Settings2,
    // },
    // {
    //   title: "Templates",
    //   url: "#",
    //   icon: Blocks,
    // },
    // {
    //   title: "Trash",
    //   url: "#",
    //   icon: Trash2,
    // },
    // {
    //   title: "Help",
    //   url: "#",
    //   icon: MessageCircleQuestion,
    // },
  ],
  favorites: [
    // {
    //   name: "Project Management & Task Tracking",
    //   url: "#",
    //   emoji: "📊",
    // },
    // {
    //   name: "Family Recipe Collection & Meal Planning",
    //   url: "#",
    //   emoji: "🍳",
    // },
    // {
    //   name: "Fitness Tracker & Workout Routines",
    //   url: "#",
    //   emoji: "💪",
    // },
    // {
    //   name: "Book Notes & Reading List",
    //   url: "#",
    //   emoji: "📚",
    // },
    // {
    //   name: "Sustainable Gardening Tips & Plant Care",
    //   url: "#",
    //   emoji: "🌱",
    // },
    // {
    //   name: "Language Learning Progress & Resources",
    //   url: "#",
    //   emoji: "🗣️",
    // },
    // {
    //   name: "Home Renovation Ideas & Budget Tracker",
    //   url: "#",
    //   emoji: "🏠",
    // },
    // {
    //   name: "Personal Finance & Investment Portfolio",
    //   url: "#",
    //   emoji: "💰",
    // },
    // {
    //   name: "Movie & TV Show Watchlist with Reviews",
    //   url: "#",
    //   emoji: "🎬",
    // },
    // {
    //   name: "Daily Habit Tracker & Goal Setting",
    //   url: "#",
    //   emoji: "✅",
    // },
  ],
  workspaces: [
    // {
    //   name: "Personal Life Management",
    //   emoji: "🏠",
    //   pages: [
    //     {
    //       name: "Daily Journal & Reflection",
    //       url: "#",
    //       emoji: "📔",
    //     },
    //     {
    //       name: "Health & Wellness Tracker",
    //       url: "#",
    //       emoji: "🍏",
    //     },
    //     {
    //       name: "Personal Growth & Learning Goals",
    //       url: "#",
    //       emoji: "🌟",
    //     },
    //   ],
    // },
    // {
    //   name: "Professional Development",
    //   emoji: "💼",
    //   pages: [
    //     {
    //       name: "Career Objectives & Milestones",
    //       url: "#",
    //       emoji: "🎯",
    //     },
    //     {
    //       name: "Skill Acquisition & Training Log",
    //       url: "#",
    //       emoji: "🧠",
    //     },
    //     {
    //       name: "Networking Contacts & Events",
    //       url: "#",
    //       emoji: "🤝",
    //     },
    //   ],
    // },
    // {
    //   name: "Creative Projects",
    //   emoji: "🎨",
    //   pages: [
    //     {
    //       name: "Writing Ideas & Story Outlines",
    //       url: "#",
    //       emoji: "✍️",
    //     },
    //     {
    //       name: "Art & Design Portfolio",
    //       url: "#",
    //       emoji: "🖼️",
    //     },
    //     {
    //       name: "Music Composition & Practice Log",
    //       url: "#",
    //       emoji: "🎵",
    //     },
    //   ],
    // },
    // {
    //   name: "Home Management",
    //   emoji: "🏡",
    //   pages: [
    //     {
    //       name: "Household Budget & Expense Tracking",
    //       url: "#",
    //       emoji: "💰",
    //     },
    //     {
    //       name: "Home Maintenance Schedule & Tasks",
    //       url: "#",
    //       emoji: "🔧",
    //     },
    //     {
    //       name: "Family Calendar & Event Planning",
    //       url: "#",
    //       emoji: "📅",
    //     },
    //   ],
    // },
    // {
    //   name: "Travel & Adventure",
    //   emoji: "🧳",
    //   pages: [
    //     {
    //       name: "Trip Planning & Itineraries",
    //       url: "#",
    //       emoji: "🗺️",
    //     },
    //     {
    //       name: "Travel Bucket List & Inspiration",
    //       url: "#",
    //       emoji: "🌎",
    //     },
    //     {
    //       name: "Travel Journal & Photo Gallery",
    //       url: "#",
    //       emoji: "📸",
    //     },
    //   ],
    // },
  ],
};

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

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

// ✅ Create nav items with dynamic isActive
  const navItems = [
    {
      title: "Templates",
      url: "/templates",
      icon: LayoutTemplate,
      isActive: pathname === "/templates" || pathname?.startsWith("/templates/"),
    },
    {
      title: "Certificates",
      url: "/certificates",
      icon: FileBadge,
      badge: "10",
      isActive: pathname === "/certificates" || pathname?.startsWith("/certificates/"),
    },
  ];

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={data.teams} /> */}
        <div className="flex items-center gap-2 h-14 border-b">
          <Image
            className="dark:invert h-12 w-auto object-contain pl-2"
            src="/Navodaya-Logo.png"
            alt="Navodaya Education Trust"
            width={40}
            height={20}
            priority
          />
          <div className="font-semibold text-gray-400">|</div>
          <div className="font-semibold text-sm">
            Certificate Generator
          </div>
        </div>
        {/* <NavMain items={data.navMain} /> */}
        <NavMain items={navItems} />
      </SidebarHeader>
      <SidebarContent>
        <NavFavorites favorites={data.favorites} />
        <NavWorkspaces workspaces={data.workspaces} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      {/* <div className="p-2 border-t">
        <NavUser user={userData.user} />
      </div> */}
      <SidebarRail />
    </Sidebar>
  );
}
