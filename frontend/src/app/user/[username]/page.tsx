'use client';

import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";
import ProfileHeader from "./utils/ProfileHeader";
import ProblemsStatsCard from "./utils/ProblemsStatsCard";
import BadgesCard from "./utils/BadgesCard";
import HeatmapCard from "./utils/HeatmapCard";
import RecentSubmissionsCard from "./utils/RecentSubmissionCard";
import { GridPattern } from "@/components/ui/grid-pattern";
import { cn } from "@/lib/utils";

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  emailId: string;
  username: string;
  role: 'user' | 'admin';
  theme: string;
  profilePicture?: string;
  subscriptionType: 'free' | 'premium';
  subscriptionExpiry?: string;
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* GridPattern Background */}
      <GridPattern
        width={40}
        height={40}
        x={-1}
        y={-1}
        squares={[
          [4, 4],
          [5, 1],
          [8, 2],
          [5, 3],
          [5, 5],
          [10, 10],
          [12, 15],
          [15, 10],
          [10, 15],
          [20, 5],
          [25, 8],
          [18, 12],
          [22, 18],
          [7, 9],
          [14, 6],
          [3, 12],
          [16, 20],
          [9, 17],
          [19, 3],
          [6, 14],
        ]}
        className={cn(
          "absolute inset-0 h-full w-full",
          "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
          "opacity-30"
        )}
      />

      {/* Sidebar + Main content layout */}
      <div className="flex gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Left sidebar */}
        <div className="w-72 flex-shrink-0">
          <div className="sticky top-4">
            <ProfileHeader username={username} />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-6">
          <ProblemsStatsCard username={username} />
          <BadgesCard username={username} />
          <HeatmapCard username={username} />
          <RecentSubmissionsCard username={username} />
        </div>
      </div>
    </div>
  );
}
