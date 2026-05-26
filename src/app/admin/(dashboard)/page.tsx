import { createServerSupabase } from "@/lib/supabase/server";
import { getDashboardStats, getRecentSites } from "@/lib/data/admin";
import { adminDisplayName } from "@/lib/greeting";
import { StatCard } from "@/components/admin/StatCard";
import { DashboardBanner } from "@/components/admin/DashboardBanner";
import { RecentSites } from "@/components/admin/RecentSites";
import { QuickActions } from "@/components/admin/QuickActions";
import { PendingApprovalCallout } from "@/components/admin/PendingApprovalCallout";

const iconClass = "h-5 w-5";

const ICONS = {
  globe: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
    </svg>
  ),
  check: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  pencil: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  tag: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.6 13.4 13 21a1.9 1.9 0 0 1-2.7 0L3 13.7V4h9.7l7.9 7.9a1.9 1.9 0 0 1 0 1.5Z" />
      <circle cx="8" cy="8" r="1.5" />
    </svg>
  ),
  briefcase: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
};

export default async function AdminDashboard() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [stats, recentSites] = await Promise.all([
    getDashboardStats(),
    getRecentSites(),
  ]);

  const name = adminDisplayName(user ?? { user_metadata: {} });

  return (
    <div className="space-y-8 p-8">
      <DashboardBanner
        name={name}
        totalSites={stats.totalSites}
        addedThisWeek={stats.sitesAddedThisWeek}
      />

      <PendingApprovalCallout count={stats.pendingCaseStudyApprovals} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total products" value={stats.totalSites} icon={ICONS.globe} />
        <StatCard label="Published" value={stats.publishedSites} icon={ICONS.check} />
        <StatCard label="Drafts" value={stats.draftSites} icon={ICONS.pencil} />
        <StatCard label="Categories" value={stats.categories} icon={ICONS.tag} />
        <StatCard label="Case studies" value={stats.caseStudyCount} icon={ICONS.briefcase} />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="lg:flex-[2]">
          <RecentSites sites={recentSites} />
        </div>
        <div className="lg:flex-[1]">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
