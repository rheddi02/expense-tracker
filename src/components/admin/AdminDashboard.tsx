import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Users, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { StatCard } from "./StatCard";
import { ChartContainer } from "./ChartContainer";
import type { UserStats, UserGrowthData } from "@/utils/adminQueries";
import { getUserStats, getUserGrowthData } from "@/utils/adminQueries";

const STATUS_COLORS: Record<string, string> = {
  pending: "#FBBF24",
  allowed: "#34D399",
  blocked: "#F87171",
};

export const AdminDashboard = () => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [growthData, setGrowthData] = useState<UserGrowthData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [stats, growth] = await Promise.all([
        getUserStats(),
        getUserGrowthData(),
      ]);

      setUserStats(stats);
      setGrowthData(growth);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-border border-t-blue-600" />
      </div>
    );
  }

  const total = userStats?.total || 0;
  const pct = (n: number) => (total > 0 ? `${Math.round((n / total) * 100)}% of users` : "—");

  const statusChartData = userStats
    ? [
        { name: "Pending", value: userStats.pending, color: STATUS_COLORS.pending },
        { name: "Allowed", value: userStats.allowed, color: STATUS_COLORS.allowed },
        { name: "Blocked", value: userStats.blocked, color: STATUS_COLORS.blocked },
      ]
    : [];

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const refreshedTime = lastRefreshed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Overview</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw size={13} />
          <span>Refreshed {refreshedTime}</span>
        </button>
      </div>

      {/* At a Glance */}
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">At a Glance</p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Total Users"
            value={total}
            icon={<Users size={20} />}
            bgColor="bg-blue-50 dark:bg-blue-500/10"
            textColor="text-blue-600 dark:text-blue-400"
            accentColor="bg-blue-500"
            detail="registered"
          />
          <StatCard
            label="Pending"
            value={userStats?.pending || 0}
            icon={<Clock size={20} />}
            bgColor="bg-amber-50 dark:bg-amber-500/10"
            textColor="text-amber-600 dark:text-amber-400"
            accentColor="bg-amber-400"
            detail={pct(userStats?.pending || 0)}
          />
          <StatCard
            label="Allowed"
            value={userStats?.allowed || 0}
            icon={<CheckCircle size={20} />}
            bgColor="bg-emerald-50 dark:bg-emerald-500/10"
            textColor="text-emerald-600 dark:text-emerald-400"
            accentColor="bg-emerald-500"
            detail={pct(userStats?.allowed || 0)}
          />
          <StatCard
            label="Blocked"
            value={userStats?.blocked || 0}
            icon={<XCircle size={20} />}
            bgColor="bg-rose-50 dark:bg-rose-500/10"
            textColor="text-rose-600 dark:text-rose-400"
            accentColor="bg-rose-500"
            detail={pct(userStats?.blocked || 0)}
          />
        </div>
      </section>

      {/* Analytics */}
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Analytics</p>

        {/* Status Pie Chart */}
        <ChartContainer title="User Status Distribution" subtitle="Breakdown by approval status">
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {statusChartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={_entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", fontSize: 12, backgroundColor: "var(--popover)", color: "var(--popover-foreground)" }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: "var(--foreground)" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-12 text-sm">No data available</p>
          )}
        </ChartContainer>

        {/* User Growth Line Chart */}
        <ChartContainer title="User Growth (Last 30 Days)" subtitle="Number of new users over time">
          {growthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", fontSize: 12, backgroundColor: "var(--popover)", color: "var(--popover-foreground)" }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: "var(--foreground)" }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: "#3B82F6", r: 3 }}
                  activeDot={{ r: 5 }}
                  name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-12 text-sm">No data available</p>
          )}
        </ChartContainer>
      </section>
    </div>
  );
};
