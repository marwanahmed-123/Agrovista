import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { parcelService } from "../../services/parcelService";
import { userService } from "../../services/userService";
import type { Parcel, User } from "../../types";
import { Clock3, Users, MapPinned, CheckCircle2 } from "lucide-react";

interface Stats {
  totalParcels: number;
  pendingParcels: number;
  totalUsers: number;
  activeUsers: number;
}

const PARCEL_COLORS: Record<string, string> = {
  APPROVED: "#16a34a",
  PENDING: "#d97706",
  REJECTED: "#dc2626",
};

const USER_COLORS: Record<string, string> = {
  ACTIVE: "#16a34a",
  PENDING_FOR_VERIFICATION: "#d97706",
  SUSPENDED: "#dc2626",
};

const StatCard = ({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  valueColor,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  valueColor: string;
}) => (
  <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs sm:text-sm text-gray-400 font-medium uppercase tracking-wide">
          {label}
        </p>
        <p
          className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2"
          style={{ color: valueColor }}
        >
          {value.toLocaleString()}
        </p>
      </div>
      <div
        className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center`}
        style={{ backgroundColor: iconBg }}
      >
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
    </div>
  </div>
);

const RADIAN = Math.PI / 180;

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentPending, setRecentPending] = useState<Parcel[]>([]);
  const [parcelChartData, setParcelChartData] = useState<
    { name: string; value: number; color: string }[]
  >([]);
  const [userChartData, setUserChartData] = useState<
    { name: string; value: number; color: string }[]
  >([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [parcels, pending, users] = await Promise.all([
        parcelService.getAllParcels(),
        parcelService.getPendingParcels(),
        userService.getAllUsers(),
      ]);

      const activeCount = users.filter(
        (u: User) => u.status === "ACTIVE",
      ).length;

      setStats({
        totalParcels: parcels.length,
        pendingParcels: pending.length,
        totalUsers: users.length,
        activeUsers: activeCount,
      });

      setRecentPending(pending.slice(0, 5));

      const parcelGroups = groupByCount(parcels, "status");
      setParcelChartData(groupsToChartData(parcelGroups, PARCEL_COLORS));

      const userGroups = groupByCount(users, "status");
      setUserChartData(groupsToChartData(userGroups, USER_COLORS));
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  function groupByCount<T>(arr: T[], key: keyof T): Map<string, number> {
    return arr.reduce((map, item) => {
      const val = String(item[key]);
      map.set(val, (map.get(val) || 0) + 1);
      return map;
    }, new Map<string, number>());
  }

  function groupsToChartData(
    groups: Map<string, number>,
    colors: Record<string, string>,
  ): { name: string; value: number; color: string }[] {
    return Array.from(groups.entries())
      .map(([name, value]) => ({
        name: name.charAt(0) + name.slice(1).toLowerCase(),
        value,
        color: colors[name.toUpperCase()] ?? "#94a3b8",
      }))
      .sort((a, b) => b.value - a.value);
  }

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { name: string; value: number; payload: { color: string } }[];
  }) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0];
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-md text-xs">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
            style={{ backgroundColor: data.payload.color }}
          />
          <span className="font-medium text-gray-900">{data.name}</span>
          <span className="text-gray-500 ml-1">{data.value}</span>
        </div>
      </div>
    );
  };

  const renderPieLabel = ({
    cx = 0,
    cy = 0,
    midAngle = 0,
    innerRadius = 0,
    outerRadius = 0,
    percent = 0,
  }: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
  }) => {
    if (!percent || percent < 0.08) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[10px] font-bold"
      >
        {(percent * 100).toFixed(0)}%
      </text>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-50 text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-3xl font-bold text-[#111827]">
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
          Welcome back — here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
        <StatCard
          label="Total Parcels"
          value={stats?.totalParcels ?? 0}
          icon={<MapPinned size={20} />}
          iconBg="#e6f0ea"
          iconColor="#1a4d2e"
          valueColor="#1a4d2e"
        />
        <StatCard
          label="Pending Approval"
          value={stats?.pendingParcels ?? 0}
          icon={<Clock3 size={20} />}
          iconBg="#fef3c7"
          iconColor="#d97706"
          valueColor="#d97706"
        />
        <StatCard
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={<Users size={20} />}
          iconBg="#e6f0ea"
          iconColor="#1a4d2e"
          valueColor="#1a4d2e"
        />
        <StatCard
          label="Active Users"
          value={stats?.activeUsers ?? 0}
          icon={<CheckCircle2 size={20} />}
          iconBg="#dcfce7"
          iconColor="#16a34a"
          valueColor="#16a34a"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5 mb-6 sm:mb-8">
        {/* Parcel Status Pie Chart */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#e6f0ea] flex items-center justify-center">
              <MapPinned size={18} className="text-primary-deeper" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                Parcel Status
              </h2>
              <p className="text-xs text-gray-400">
                Distribution across all parcels
              </p>
            </div>
          </div>
          <div className="h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={parcelChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderPieLabel}
                  outerRadius="80%"
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {parcelChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={10}
                  formatter={(value: string) => (
                    <span className="text-xs text-gray-600">{value}</span>
                  )}
                  wrapperStyle={{ paddingTop: "0.75rem" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Status Pie Chart */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Users size={18} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                User Status
              </h2>
              <p className="text-xs text-gray-400">
                Distribution across all users
              </p>
            </div>
          </div>
          <div className="h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderPieLabel}
                  outerRadius="80%"
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {userChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={10}
                  formatter={(value: string) => (
                    <span className="text-xs text-gray-600">{value}</span>
                  )}
                  wrapperStyle={{ paddingTop: "0.75rem" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pending parcels table */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 p-4 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Clock3 size={18} className="text-orange-500" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                Pending Parcel Approvals
              </h2>
              <p className="text-xs text-gray-400">
                Latest parcels awaiting review
              </p>
            </div>
          </div>
          {recentPending.length > 0 && (
            <a
              href="/admin/pending-parcels"
              className="flex items-center gap-1 text-xs font-semibold text-primary-deeper hover:underline"
            >
              View all
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          )}
        </div>

        {recentPending.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-gray-400 gap-2">
            <Clock3 size={36} className="text-gray-300" />
            <p className="text-sm">No pending parcels for approval.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Parcel Name
                  </th>
                  <th className="text-left py-3 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Region
                  </th>
                  <th className="text-left py-3 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                    Size (acres)
                  </th>
                  <th className="text-left py-3 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentPending.map((parcel) => (
                  <tr
                    key={parcel._id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-gray-800">
                      {parcel.parcelName}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-gray-500">
                      {parcel.locationId || parcel.region || "Unknown"}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-gray-500 hidden sm:table-cell">
                      {parcel.size}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        {parcel.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
