import { useEffect, useMemo, useState } from "react";
import { userService } from "../../services/userService";
import type { User } from "../../types";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChevronDown,
  ChevronUp,
  Shield,
  Users as UsersIcon,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import SearchInput from "../../components/SearchInput";
import SortDropdown, { type SortOption } from "../../components/SortDropdown";
import ConfirmModal from "../../components/ConfirmModal";
import Pagination from "../../components/Pagination";

type SortKey =
  | "name-asc"
  | "name-desc"
  | "email-asc"
  | "email-desc"
  | "status-active"
  | "status-suspended";

const sortOptions: SortOption<SortKey>[] = [
  { value: "name-asc", label: "Name A\u2013Z" },
  { value: "name-desc", label: "Name Z\u2013A" },
  { value: "email-asc", label: "Email A\u2013Z" },
  { value: "email-desc", label: "Email Z\u2013A" },
  { value: "status-active", label: "Active first" },
  { value: "status-suspended", label: "Suspended first" },
];

const ROLE_COLORS = ["#DC2626", "#3B82F6", "#8B5CF6"];
const STATUS_COLORS = ["#10B981", "#EF4444", "#F59E0B"];
const RADIAN = Math.PI / 180;

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name-asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmSuspend, setConfirmSuspend] = useState<{
    id: string;
    name: string;
    newStatus: "ACTIVE" | "SUSPENDED";
  } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getAllUsers();
      setUsers(data.filter((u) => u.role === "USER"));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const filteredSortedUsers = useMemo(() => {
    let result = users.filter((u) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        u.firstName?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.id?.toLowerCase().includes(q)
      );
    });

    result.sort((a, b) => {
      const fullA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const fullB = `${b.firstName} ${b.lastName}`.toLowerCase();
      switch (sortBy) {
        case "name-asc":
          return fullA.localeCompare(fullB);
        case "name-desc":
          return fullB.localeCompare(fullA);
        case "email-asc":
          return (a.email || "").localeCompare(b.email || "");
        case "email-desc":
          return (b.email || "").localeCompare(a.email || "");
        case "status-active":
          return a.status === "ACTIVE" ? -1 : 1;
        case "status-suspended":
          return a.status === "SUSPENDED" ? -1 : 1;
        default:
          return 0;
      }
    });

    return result;
  }, [users, searchQuery, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSortedUsers.length / pageSize),
  );
  const paginatedUsers = filteredSortedUsers.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy]);

  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const suspendedCount = users.filter((u) => u.status === "SUSPENDED").length;
  const unverifiedCount = users.filter((u) => !u.isVerified).length;
  const pendingCount = users.filter(
    (u) => u.status === "PENDING_FOR_VERIFICATION",
  ).length;

  const roleData = [
    { name: "Admins", value: users.filter((u) => u.role === "ADMIN").length },
    { name: "Users", value: users.filter((u) => u.role === "USER").length },
  ];

  const statusData = [
    { name: "Active", value: activeCount },
    { name: "Suspended", value: suspendedCount },
    { name: "Pending", value: pendingCount },
  ];

  const verificationData = [
    { label: "Verified", value: users.filter((u) => u.isVerified).length },
    { label: "Unverified", value: users.filter((u) => !u.isVerified).length },
  ];

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { name: string; value: number; payload: { fill: string } }[];
  }) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0];
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-md text-xs">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
            style={{ backgroundColor: data.payload.fill }}
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

  const handleStatusChange = async (
    id: string,
    newStatus: "ACTIVE" | "SUSPENDED",
  ) => {
    setProcessing(id);
    setError(null);
    setSuccess(null);
    setConfirmSuspend(null);
    try {
      await userService.updateUserStatus(id, newStatus);
      setSuccess(
        `User ${newStatus === "SUSPENDED" ? "suspended" : "activated"} successfully`,
      );
      setUsers(
        users.map((user) =>
          user.id === id ? { ...user, status: newStatus } : user,
        ),
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          `Failed to ${newStatus === "SUSPENDED" ? "suspend" : "activate"} user`,
      );
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: User["status"]) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-accent-green">
            <UserCheck size={12} /> Active
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-accent-red">
            <ShieldAlert size={12} /> Suspended
          </span>
        );
      case "PENDING_FOR_VERIFICATION":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-accent-orange">
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  const getRoleBadge = (role: User["role"]) => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            <Shield size={12} /> Super Admin
          </span>
        );
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            <Shield size={12} /> Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
            <UsersIcon size={12} /> User
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-50 text-gray-500">
        Loading users...
      </div>
    );
  }

  const renderUserRow = (user: User) => {
    const isOpen = expandedId === user.id;
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    return (
      <div key={user.id}>
        <button
          onClick={() => setExpandedId(isOpen ? null : user.id)}
          className="lg:hidden w-full flex items-center justify-between p-4 hover:bg-gray-50 transition text-left"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {user.email}
              </p>
            </div>
            <span className="shrink-0">{getStatusBadge(user.status)}</span>
          </div>
          {isOpen ? (
            <ChevronUp size={18} className="text-gray-400 shrink-0 ml-2" />
          ) : (
            <ChevronDown size={18} className="text-gray-400 shrink-0 ml-2" />
          )}
        </button>

        {isOpen && (
          <div className="lg:hidden px-4 pb-4">
            <div className="border-t border-gray-100 pt-3 space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {getRoleBadge(user.role)}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">ID: {user.id}</p>
            </div>
            <div className="flex flex-col gap-2">
              {!isAdmin &&
                (user.status === "ACTIVE" ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmSuspend({
                        id: user.id,
                        name: `${user.firstName} ${user.lastName}`,
                        newStatus: "SUSPENDED",
                      });
                    }}
                    disabled={processing === user.id}
                    className="w-full px-4 py-2.5 rounded-xl bg-accent-red hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium"
                  >
                    {processing === user.id ? "Processing..." : "Suspend"}
                  </button>
                ) : user.status === "SUSPENDED" ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmSuspend({
                        id: user.id,
                        name: `${user.firstName} ${user.lastName}`,
                        newStatus: "ACTIVE",
                      });
                    }}
                    disabled={processing === user.id}
                    className="w-full px-4 py-2.5 rounded-xl bg-accent-green hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium"
                  >
                    {processing === user.id ? "Processing..." : "Activate"}
                  </button>
                ) : null)}
            </div>
          </div>
        )}

        <div className="hidden lg:flex items-center p-5 hover:bg-gray-50 transition">
          <div className="flex-1 grid grid-cols-5 gap-4 items-center">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div className="text-sm text-gray-600 truncate">{user.email}</div>
            <div>{getRoleBadge(user.role)}</div>
            <div>{getStatusBadge(user.status)}</div>
            <div className="flex items-center gap-2">
              {!isAdmin &&
                (user.status === "ACTIVE" ? (
                  <button
                    onClick={() =>
                      setConfirmSuspend({
                        id: user.id,
                        name: `${user.firstName} ${user.lastName}`,
                        newStatus: "SUSPENDED",
                      })
                    }
                    disabled={processing === user.id}
                    className="px-3 py-1.5 rounded-xl bg-accent-red hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium"
                  >
                    {processing === user.id ? "Processing..." : "Suspend"}
                  </button>
                ) : user.status === "SUSPENDED" ? (
                  <button
                    onClick={() =>
                      setConfirmSuspend({
                        id: user.id,
                        name: `${user.firstName} ${user.lastName}`,
                        newStatus: "ACTIVE",
                      })
                    }
                    disabled={processing === user.id}
                    className="px-3 py-1.5 rounded-xl bg-accent-green hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium"
                  >
                    {processing === user.id ? "Processing..." : "Activate"}
                  </button>
                ) : null)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
            User Management
          </h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
            View and manage user accounts.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-red-50 border border-red-100 p-4 text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-2xl bg-green-50 border border-green-100 p-4 text-green-700">
            {success}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 sm:gap-5 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-400 font-medium">
                  ACTIVE
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-accent-green mt-1 sm:mt-2">
                  {activeCount}
                </h2>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-green-100 flex items-center justify-center">
                <UserCheck className="text-accent-green" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-400 font-medium">
                  SUSPENDED
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-accent-red mt-1 sm:mt-2">
                  {suspendedCount}
                </h2>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-red-100 flex items-center justify-center">
                <ShieldAlert className="text-accent-red" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-400 font-medium">
                  PENDING VERIFICATION
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-accent-orange mt-1 sm:mt-2">
                  {unverifiedCount}
                </h2>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-orange-100 flex items-center justify-center">
                <UsersIcon className="text-accent-orange" size={20} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Shield size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                  User Roles
                </h3>
                <p className="text-xs text-gray-400">
                  Distribution of platform roles
                </p>
              </div>
            </div>
            <div className="h-65">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleData}
                    dataKey="value"
                    nameKey="name"
                    labelLine={false}
                    label={renderPieLabel}
                    outerRadius="80%"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {roleData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={ROLE_COLORS[index % ROLE_COLORS.length]}
                      />
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

          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <UserCheck size={18} className="text-accent-green" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                  Account Status
                </h3>
                <p className="text-xs text-gray-400">
                  Active vs suspended users
                </p>
              </div>
            </div>
            <div className="h-65">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    labelLine={false}
                    label={renderPieLabel}
                    outerRadius="80%"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {statusData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                      />
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

          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <UsersIcon size={18} className="text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                  Email Verification
                </h3>
                <p className="text-xs text-gray-400">Verification coverage</p>
              </div>
            </div>
            <div className="h-65">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={verificationData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0)
                        return null;
                      return (
                        <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-md text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {payload[0].payload.label}
                            </span>
                            <span className="text-gray-500 ml-1">
                              {payload[0].value}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[8, 8, 0, 0]}
                    fill={
                      verificationData[0]?.value > verificationData[1]?.value
                        ? "#10B981"
                        : "#F59E0B"
                    }
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="w-full sm:w-auto">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                All Users
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1">
                {filteredSortedUsers.length} of {users.length} users
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SearchInput
                id="user-search"
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search users..."
              />
              <SortDropdown
                options={sortOptions}
                value={sortBy}
                onChange={setSortBy}
              />
            </div>
          </div>

          {paginatedUsers.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <UsersIcon className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-500 font-medium text-sm sm:text-base">
                {users.length === 0
                  ? "No users found"
                  : "No users match your search"}
              </p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                {users.length === 0
                  ? "Users will appear here once they register."
                  : "Try a different search or filter."}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {paginatedUsers.map(renderUserRow)}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!confirmSuspend}
        title={
          confirmSuspend?.newStatus === "SUSPENDED"
            ? "Suspend User"
            : "Activate User"
        }
        message={
          confirmSuspend?.newStatus === "SUSPENDED"
            ? `Are you sure you want to suspend ${confirmSuspend?.name}? They will lose access to the platform.`
            : `Are you sure you want to reactivate ${confirmSuspend?.name}? They will regain access to the platform.`
        }
        confirmLabel={
          confirmSuspend?.newStatus === "SUSPENDED" ? "Suspend" : "Activate"
        }
        variant={
          confirmSuspend?.newStatus === "SUSPENDED" ? "danger" : "success"
        }
        loading={processing === confirmSuspend?.id}
        onConfirm={() =>
          confirmSuspend &&
          handleStatusChange(confirmSuspend.id, confirmSuspend.newStatus)
        }
        onCancel={() => setConfirmSuspend(null)}
      />
    </div>
  );
}
