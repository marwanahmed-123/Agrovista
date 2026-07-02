import { useEffect, useMemo, useState } from "react";
import { parcelService } from "../../services/parcelService";
import { userService } from "../../services/userService";
import type { Parcel, User } from "../../types";
import { LocationName } from "../../hooks/useLocationName";
import { ModeratorName } from "../../hooks/useModeratorName";
import {
  CheckCircle2,
  XCircle,
  MapPinned,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  Ruler,
  Calendar,
  UserCheck,
  FileText,
  ShieldPlus,
  Sprout,
  Building2,
} from "lucide-react";
import SearchInput from "../../components/SearchInput";
import SortDropdown, { type SortOption } from "../../components/SortDropdown";
import Pagination from "../../components/Pagination";

type SortKey =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "largest"
  | "smallest"
  | "assigned"
  | "unassigned";

const sortOptions: SortOption<SortKey>[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name-asc", label: "Name A\u2013Z" },
  { value: "name-desc", label: "Name Z\u2013A" },
  { value: "largest", label: "Largest" },
  { value: "smallest", label: "Smallest" },
  { value: "unassigned", label: "Unassigned" },
  { value: "assigned", label: "Assigned" },
];

export default function ApprovedParcels() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<Parcel | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<Parcel | null>(null);
  const [moderators, setModerators] = useState<User[]>([]);
  const [loadingModerators, setLoadingModerators] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [viewingModerator, setViewingModerator] = useState<User | null>(null);
  const [loadingModeratorInfo, setLoadingModeratorInfo] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "APPROVED" | "REJECTED">("ALL");
  const [confirmReject, setConfirmReject] = useState<Parcel | null>(null);
  const [confirmApprove, setConfirmApprove] = useState<Parcel | null>(null);

  useEffect(() => {
    loadParcels();
  }, []);

  const loadParcels = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await parcelService.getAllParcels();
      setParcels(data.filter((p) => p && p.status !== "PENDING"));
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to load parcels",
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredSortedParcels = useMemo(() => {
    let result = parcels.filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.parcelName?.toLowerCase().includes(q) ||
        p._id?.toLowerCase().includes(q) ||
        (p.locationId || p.region || "")?.toLowerCase().includes(q) ||
        p.moderatorId?.toLowerCase().includes(q)
      );
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.updatedAt || 0).getTime() -
            new Date(a.updatedAt || 0).getTime()
          );
        case "oldest":
          return (
            new Date(a.updatedAt || 0).getTime() -
            new Date(b.updatedAt || 0).getTime()
          );
        case "name-asc":
          return (a.parcelName || "").localeCompare(b.parcelName || "");
        case "name-desc":
          return (b.parcelName || "").localeCompare(a.parcelName || "");
        case "largest":
          return (b.size || 0) - (a.size || 0);
        case "smallest":
          return (a.size || 0) - (b.size || 0);
        case "assigned":
          return a.moderatorId ? -1 : 1;
        case "unassigned":
          return a.moderatorId ? 1 : -1;
        default:
          return 0;
      }
    });

    return result;
  }, [parcels, searchQuery, sortBy, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSortedParcels.length / pageSize));
  const paginatedParcels = filteredSortedParcels.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy, statusFilter]);

  const handleApproveParcel = async (parcelId: string) => {
    setAssigning(true);
    setError(null);
    setSuccess(null);
    try {
      await parcelService.approveParcel(parcelId);
      setSuccess("Parcel approved successfully");
      loadParcels();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to approve parcel");
    } finally {
      setAssigning(false);
    }
  };

  const handleRejectParcel = async (parcelId: string) => {
    setAssigning(true);
    setError(null);
    setSuccess(null);
    try {
      await parcelService.rejectParcel(parcelId);
      setSuccess("Parcel rejected successfully");
      loadParcels();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reject parcel");
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignModerator = async (moderatorId: string) => {
    if (!showAssignModal) return;
    setAssigning(true);
    setError(null);
    setSuccess(null);
    try {
      await parcelService.assignModerator(showAssignModal._id, moderatorId);
      setSuccess("Moderator assigned successfully");
      setShowAssignModal(null);
      loadParcels();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to assign moderator");
    } finally {
      setAssigning(false);
    }
  };

  const openAssignModal = async (parcel: Parcel) => {
    if (!parcel.locationId && !parcel.region) {
      setError(
        "This parcel has no location assigned. Please ensure the parcel has a valid location before assigning a moderator.",
      );
      return;
    }
    setShowAssignModal(parcel);
    setLoadingModerators(true);
    setError(null);
    try {
      const mods = await userService.discoverModerators(parcel._id);
      setModerators(mods);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load moderators");
    } finally {
      setLoadingModerators(false);
    }
  };

  const handleViewModerator = async (moderatorId: string) => {
    setLoadingModeratorInfo(true);
    setError(null);
    try {
      const mod = await userService.getUserById(moderatorId);
      setViewingModerator(mod);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load moderator info");
    } finally {
      setLoadingModeratorInfo(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "\u2014";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return "\u2014";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-50 text-gray-500">
        Loading parcels...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB] p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
            Parcels
          </h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
            Manage all parcels.
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

        {parcels.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 mb-6 sm:mb-8">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400 font-medium">TOTAL</p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{parcels.length}</h2>
                </div>
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gray-100 flex items-center justify-center">
                  <MapPinned className="text-gray-500" size={20} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400 font-medium">APPROVED</p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-green-600 mt-1 sm:mt-2">
                    {parcels.filter((p) => p.status === "APPROVED").length}
                  </h2>
                </div>
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="text-green-600" size={20} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400 font-medium">REJECTED</p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-red-600 mt-1 sm:mt-2">
                    {parcels.filter((p) => p.status === "REJECTED").length}
                  </h2>
                </div>
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-red-100 flex items-center justify-center">
                  <XCircle className="text-red-600" size={20} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="w-full sm:w-auto">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Parcels
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {(["ALL", "APPROVED", "REJECTED"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                      statusFilter === status
                        ? status === "ALL"
                          ? "bg-gray-900 text-white"
                          : status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                {filteredSortedParcels.length} of {parcels.length} parcels
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SearchInput
                id="approved-search"
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search parcels..."
              />
              <SortDropdown
                options={sortOptions}
                value={sortBy}
                onChange={setSortBy}
              />
            </div>
          </div>

          {paginatedParcels.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <CheckCircle2 className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-500 font-medium text-sm sm:text-base">
                {parcels.length === 0
                  ? "No parcels"
                  : statusFilter === "ALL"
                    ? "No parcels match your search"
                    : `No ${statusFilter.toLowerCase()} parcels match your search`}
              </p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                {parcels.length === 0
                  ? "Parcels will appear here."
                  : "Try a different search or filter."}
              </p>
            </div>
          ) : (
            <>
            <div className="divide-y divide-gray-100">
              {paginatedParcels.filter(Boolean).map((parcel) => {
                const isOpen = expandedId === parcel._id;
                const hasModerator = !!parcel.moderatorId;
                const isSelfManaged = parcel.managedType === "SELF_MANAGED";
                const isRejected = parcel.status === "REJECTED";
                return (
                  <div key={parcel._id}>
                    <button
                      onClick={() => setExpandedId(isOpen ? null : parcel._id)}
                      className="lg:hidden w-full flex items-center justify-between p-4 hover:bg-gray-50 transition text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {isRejected ? (
                          <XCircle size={16} className="shrink-0 text-red-500" />
                        ) : (
                          <CheckCircle2 size={16} className="shrink-0 text-green-500" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {parcel.parcelName}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isSelfManaged
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {isSelfManaged ? "User managed" : "Agrovista managed"}
                        </span>
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
                            <MapPin size={14} className="shrink-0 text-gray-400" />
                            <span>
                              <LocationName locationId={parcel.locationId} region={parcel.region} />
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Ruler size={14} className="shrink-0 text-gray-400" />
                            <span>{parcel.size} acres</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={14} className="shrink-0 text-gray-400" />
                            <span>{isRejected ? "Rejected" : "Approved"} {formatDate(parcel.updatedAt)}</span>
                          </div>
                          {parcel.moderatorId && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <UserCheck size={14} className="shrink-0 text-gray-400" />
                              <span>
                                <ModeratorName moderatorId={parcel.moderatorId} />
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Sprout size={14} className="shrink-0 text-gray-400" />
                            <span>{parcel.currentCrop?.cropName || "No crop assigned yet"}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {isRejected && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmApprove(parcel); }}
                              className="w-full px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
                            >
                              <span className="flex items-center justify-center gap-1.5">
                                <CheckCircle2 size={16} />
                                Approve Parcel
                              </span>
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); hasModerator && handleViewModerator(parcel.moderatorId!); }}
                            disabled={!hasModerator || isRejected}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-purple-500 text-purple-700 bg-purple-50 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <span className="flex items-center justify-center gap-1.5">
                              <UserCheck size={16} />
                              View Moderator
                            </span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openAssignModal(parcel); }}
                            disabled={isRejected || isSelfManaged}
                            className="w-full px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="flex items-center justify-center gap-1.5">
                              <ShieldPlus size={16} />
                              Assign Moderator
                            </span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedContract(parcel); }}
                            disabled={isRejected}
                            className="w-full px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="flex items-center justify-center gap-1.5">
                              <FileText size={16} />
                              Review Contract
                            </span>
                          </button>
                          {!isRejected && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmReject(parcel); }}
                              className="w-full px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
                            >
                              <span className="flex items-center justify-center gap-1.5">
                                <XCircle size={16} />
                                Reject Parcel
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="hidden lg:flex xl:hidden items-center gap-3 p-4 hover:bg-gray-50 transition">
                      <div className="flex-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          {isRejected ? (
                            <XCircle size={16} className="shrink-0 text-red-500" />
                          ) : (
                            <CheckCircle2 size={16} className="shrink-0 text-green-500" />
                          )}
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {parcel.parcelName}
                          </p>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isSelfManaged
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {isSelfManaged ? "User managed" : "Agrovista managed"}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin size={14} className="shrink-0 text-gray-400" />
                          <LocationName locationId={parcel.locationId} region={parcel.region} />
                        </span>
                        <span className="text-sm text-gray-600">{parcel.size} acres</span>
                        <span className="flex items-center gap-1 text-sm text-gray-600">
                          <Sprout size={14} className="shrink-0 text-gray-400" />
                          <span>{parcel.currentCrop?.cropName || "No crop assigned yet"}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isRejected && (
                          <button onClick={() => setConfirmApprove(parcel)}
                            className="p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
                            title="Approve Parcel">
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        <button onClick={() => hasModerator && handleViewModerator(parcel.moderatorId!)}
                          disabled={!hasModerator || isRejected}
                          className="p-2 rounded-lg border-2 border-purple-500 text-purple-700 bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="View Moderator">
                          <UserCheck size={16} />
                        </button>
                        <button onClick={() => openAssignModal(parcel)}
                          disabled={isRejected || isSelfManaged}
                          className="p-2 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                          title="Assign Moderator">
                          <ShieldPlus size={16} />
                        </button>
                        <button onClick={() => setSelectedContract(parcel)}
                          disabled={isRejected}
                          className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Review Contract">
                          <FileText size={16} />
                        </button>
                        {!isRejected && (
                          <button onClick={() => setConfirmReject(parcel)}
                            className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                            title="Reject Parcel">
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="hidden xl:flex items-center p-5 hover:bg-gray-50 transition">
                      <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                        <div className="flex items-center gap-2 min-w-0">
                          {isRejected ? (
                            <XCircle size={16} className="shrink-0 text-red-500" />
                          ) : (
                            <CheckCircle2 size={16} className="shrink-0 text-green-500" />
                          )}
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {parcel.parcelName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin size={14} className="shrink-0 text-gray-400" />
                          <span>
                            <LocationName locationId={parcel.locationId} region={parcel.region} />
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Ruler size={14} className="shrink-0 text-gray-400" />
                          <span>{parcel.size} acres</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Sprout size={14} className="shrink-0 text-gray-400" />
                          <span>{parcel.currentCrop?.cropName || "No crop assigned yet"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {isSelfManaged ? (
                            <span className="inline-flex items-center gap-1 text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full text-xs font-medium">
                              <UserCheck size={12} />
                              User managed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full text-xs font-medium">
                              <Building2 size={12} />
                              Agrovista managed
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        {isRejected && (
                          <button onClick={() => setConfirmApprove(parcel)}
                            className="px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium">
                            <span className="flex items-center gap-1.5"><CheckCircle2 size={15} /> Approve</span>
                          </button>
                        )}
                        <button onClick={() => hasModerator && handleViewModerator(parcel.moderatorId!)}
                          disabled={!hasModerator || isRejected}
                          className="px-3 py-2 rounded-xl border-2 border-purple-500 text-purple-700 bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium">
                          <span className="flex items-center gap-1.5"><UserCheck size={15} /> View</span>
                        </button>
                        <button onClick={() => openAssignModal(parcel)}
                          disabled={isRejected || isSelfManaged}
                          className="px-3 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium">
                          <span className="flex items-center gap-1.5"><ShieldPlus size={15} /> Assign</span>
                        </button>
                        <button onClick={() => setSelectedContract(parcel)}
                          disabled={isRejected}
                          className="px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                          <span className="flex items-center gap-1.5"><FileText size={15} /> Contract</span>
                        </button>
                        {!isRejected && (
                          <button onClick={() => setConfirmReject(parcel)}
                            className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium">
                            <span className="flex items-center gap-1.5"><XCircle size={15} /> Reject</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>

      {selectedContract && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-4 sm:p-6 mx-auto max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Parcel Contract
              </h2>
              <button onClick={() => setSelectedContract(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Parcel Name</p>
                <p className="text-gray-900 font-medium">{selectedContract.parcelName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Location</p>
                <p className="text-gray-900"><LocationName locationId={selectedContract.locationId} region={selectedContract.region} /></p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Size</p>
                <p className="text-gray-900">{selectedContract.size} acres</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Status</p>
                <p className="text-accent-green font-medium">{selectedContract.status}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Approved Date</p>
                <p className="text-gray-900">{formatDate(selectedContract.updatedAt)}</p>
              </div>
              {selectedContract.moderatorId && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Moderator</p>
                  <p className="text-gray-900"><ModeratorName moderatorId={selectedContract.moderatorId} /></p>
                </div>
              )}
              {selectedContract.contract && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Contract Document</p>
                  <a href={selectedContract.contract.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 text-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </a>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setSelectedContract(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors duration-200 text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {(loadingModeratorInfo || viewingModerator) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6 mx-auto">
            {loadingModeratorInfo ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Loading moderator info...</p>
              </div>
            ) : viewingModerator ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Moderator Details</h2>
                <button onClick={() => setViewingModerator(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <UserCheck size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{viewingModerator.firstName} {viewingModerator.lastName}</p>
                    <p className="text-sm text-gray-500">{viewingModerator.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Moderator ID</p>
                  <p className="text-gray-900 font-mono text-sm mt-0.5">{viewingModerator.id}</p>
                </div>
                {viewingModerator.phoneNumber && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Phone</p>
                    <p className="text-gray-900 text-sm mt-0.5">{viewingModerator.phoneNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Status</p>
                  <p className="text-sm mt-0.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      viewingModerator.status === "ACTIVE"
                        ? "bg-green-100 text-accent-green"
                        : "bg-red-100 text-accent-red"
                    }`}>
                      {viewingModerator.status === "ACTIVE" ? "Active" : "Suspended"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => setViewingModerator(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors duration-200 text-sm">
                  Close
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6 mx-auto max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Assign Moderator</h2>
              <button onClick={() => setShowAssignModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition">
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              Select a moderator for <strong>{showAssignModal.parcelName}</strong> in{" "}
              <strong><LocationName locationId={showAssignModal.locationId} region={showAssignModal.region} /></strong>
            </p>
            {loadingModerators ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Loading moderators...</p>
              </div>
            ) : moderators.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UserCheck className="text-gray-400" size={24} />
                </div>
                <p className="text-gray-500 font-medium text-sm">No moderators found</p>
                <p className="text-xs text-gray-400 mt-1">No moderators available for this location.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {moderators.map((mod) => (
                  <button key={mod.id} onClick={() => handleAssignModerator(mod.id)} disabled={assigning}
                    className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-70 border border-gray-100">
                    <p className="font-medium text-gray-900 text-sm">{mod.firstName} {mod.lastName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{mod.email}</p>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button onClick={() => setShowAssignModal(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors duration-200 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {confirmApprove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-4 sm:p-6 mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Confirm Approval</h2>
              <button onClick={() => setConfirmApprove(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition">
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to approve <strong>{confirmApprove.parcelName}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmApprove(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors duration-200 text-sm">
                Cancel
              </button>
              <button onClick={() => { handleApproveParcel(confirmApprove._id); setConfirmApprove(null); }}
                disabled={assigning}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 text-sm">
                {assigning ? "Approving..." : "Confirm Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmReject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-4 sm:p-6 mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Confirm Rejection</h2>
              <button onClick={() => setConfirmReject(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition">
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to reject <strong>{confirmReject.parcelName}</strong>? This action can be undone by approving the parcel again.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmReject(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors duration-200 text-sm">
                Cancel
              </button>
              <button onClick={() => { handleRejectParcel(confirmReject._id); setConfirmReject(null); }}
                disabled={assigning}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 text-sm">
                {assigning ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
