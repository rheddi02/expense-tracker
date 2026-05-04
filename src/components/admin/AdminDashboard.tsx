import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Users, Clock, CheckCircle, XCircle } from "lucide-react";
import { StatCard } from "./StatCard";
import { ChartContainer } from "./ChartContainer";
import type {
  UserStats,
  UserGrowthData,
  RoleDistribution,
} from "@/utils/adminQueries";
import {
  getUserStats,
  getUserGrowthData,
  getRoleDistribution,
} from "@/utils/adminQueries";

const STATUS_COLORS: Record<string, string> = {
  pending: "#FBBF24",
  allowed: "#34D399",
  blocked: "#F87171",
};

const ROLE_COLORS = ["#3B82F6", "#8B5CF6"];

export const AdminDashboard = () => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [growthData, setGrowthData] = useState<UserGrowthData[]>([]);
  const [roleData, setRoleData] = useState<RoleDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stats, growth, roles] = await Promise.all([
          getUserStats(),
          getUserGrowthData(),
          getRoleDistribution(),
        ]);

        setUserStats(stats);
        setGrowthData(growth);
        setRoleData(roles);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statusChartData = userStats
    ? [
        { name: "Pending", value: userStats.pending, color: STATUS_COLORS.pending },
        { name: "Allowed", value: userStats.allowed, color: STATUS_COLORS.allowed },
        { name: "Blocked", value: userStats.blocked, color: STATUS_COLORS.blocked },
      ]
    : [];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          label="Total Users"
          value={userStats?.total || 0}
          icon={<Users size={24} />}
          bgColor="bg-blue-100"
          textColor="text-blue-600"
        />
        <StatCard
          label="Pending"
          value={userStats?.pending || 0}
          icon={<Clock size={24} />}
          bgColor="bg-yellow-100"
          textColor="text-yellow-600"
        />
        <StatCard
          label="Allowed"
          value={userStats?.allowed || 0}
          icon={<CheckCircle size={24} />}
          bgColor="bg-green-100"
          textColor="text-green-600"
        />
        <StatCard
          label="Blocked"
          value={userStats?.blocked || 0}
          icon={<XCircle size={24} />}
          bgColor="bg-red-100"
          textColor="text-red-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* User Status Pie Chart */}
        <ChartContainer title="User Status Distribution" subtitle="Breakdown by approval status">
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={_entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No data available</p>
          )}
        </ChartContainer>

        {/* Role Distribution Bar Chart */}
        <ChartContainer title="Role Distribution" subtitle="Admin vs User count">
          {roleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="role" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {roleData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No data available</p>
          )}
        </ChartContainer>
      </div>

      {/* User Growth Line Chart */}
      <ChartContainer
        title="User Growth (Last 30 Days)"
        subtitle="Number of new users over time"
      >
        {growthData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: "#3B82F6", r: 4 }}
                activeDot={{ r: 6 }}
                name="New Users"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-12">No data available</p>
        )}
      </ChartContainer>
    </div>
  );
};
