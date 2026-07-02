import { useEffect, useMemo, useState } from "react";
import { parcelService } from "../../services/parcelService";
import { userService } from "../../services/userService";
import type { Parcel, User } from "../../types";
import { LocationName } from "../../hooks/useLocationName";
import {
  CheckCircle2,
  Clock3,
  ChevronDown,
  ChevronUp,
  MapPin,
  Ruler,
  Calendar,
  X,
  FileText,
  UserCheck,
  Building2,
  Sprout,
} from "lucide-react";
import SearchInput from "../../components/SearchInput";
import SortDropdown, { type SortOption } from "../../components/SortDropdown";
import ConfirmModal from "../../components/ConfirmModal";
import Pagination from "../../components/Pagination";

type SortKey =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "largest"
  | "smallest";

const sortOptions: SortOption<SortKey>[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "largest", label: "Largest" },
  { value: "smallest", label: "Smallest" },
];

export default function PendingParcels() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    type: "approve" | "reject";
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedContract, setSelectedContract] = useState<Parcel | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<Parcel | null>(null);
  const [moderators, setModerators] = useState<User[]>([]);
  const [loadingModerators, setLoadingModerators] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedModeratorId, setSelectedModeratorId] = useState<string | null>(
    null,
  );

  const filteredSortedParcels = useMemo(() => {
    let result = parcels.filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.parcelName?.toLowerCase().includes(q) ||
        p._id?.toLowerCase().includes(q) ||
        (p.locationId || p.region || "")?.toLowerCase().includes(q) ||
        p.status?.toLowerCase().includes(q)
      );
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
          );
        case "name-asc":
          return (a.parcelName || "").localeCompare(b.parcelName || "");
        case "name-desc":
          return (b.parcelName || "").localeCompare(a.parcelName || "");
        case "largest":
          return (b.size || 0) - (a.size || 0);
        case "smallest":
          return (a.size || 0) - (b.size || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [parcels, searchQuery, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSortedParcels.length / pageSize),
  );
  const paginatedParcels = filteredSortedParcels.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "\u2014";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return "\u2014";
    }
  };

  useEffect(() => {
    loadParcels();
  }, []);

  const loadParcels = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await parcelService.getPendingParcels();
      setParcels(data.filter((parcel: any) => parcel && parcel._id));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load pending parcels");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirmAction?.id) return;
    const actionId = confirmAction.id;
    setProcessing(actionId);
    setError(null);
    setSuccess(null);
    setConfirmAction(null);
    try {
      await parcelService.approveParcel(actionId);
      setSuccess("Parcel approved successfully");
      setParcels((prev) => prev.filter((p) => p && p._id !== actionId));
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to approve parcel";
      setError(msg);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!confirmAction?.id) return;
    const actionId = confirmAction.id;
    setProcessing(actionId);
    setError(null);
    setSuccess(null);
    setConfirmAction(null);
    try {
      await parcelService.rejectParcel(actionId);
      setSuccess("Parcel rejected successfully");
      setParcels((prev) => prev.filter((p) => p && p._id !== actionId));
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || "Failed to reject parcel";
      setError(msg);
    } finally {
      setProcessing(null);
    }
  };

  const openAssignForApproval = async (parcel: Parcel) => {
    if (!parcel.locationId && !parcel.region) {
      setError("This parcel has no location assigned.");
      return;
    }
    setShowAssignModal(parcel);
    setSelectedModeratorId(null);
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

  const handleAssignAndApprove = async (moderatorId: string) => {
    if (!showAssignModal) return;
    const parcelId = showAssignModal._id;
    setAssigning(true);
    setError(null);
    try {
      await parcelService.assignModerator(parcelId, moderatorId);
      await parcelService.approveParcel(parcelId);
      setSuccess("Parcel approved successfully");
      setShowAssignModal(null);
      setParcels((prev) => prev.filter((p) => p && p._id !== parcelId));
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to approve parcel";
      setError(msg);
    } finally {
      setAssigning(false);
    }
  };

  const handleApproveClick = (parcel: Parcel) => {
    if (parcel.managedType === "AGROVISTA_MANAGED") {
      openAssignForApproval(parcel);
    } else {
      setConfirmAction({ id: parcel._id, type: "approve" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-50 text-gray-500">
        Loading pending parcels...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB] p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
            Pending Parcel Approvals
          </h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
            Review and manage parcels awaiting approval.
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

        <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 sm:gap-5 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-400 font-medium">
                  PENDING REVIEW
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-accent-orange mt-1 sm:mt-2">
                  {parcels.length}
                </h2>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-orange-100 flex items-center justify-center">
                <Clock3 className="text-accent-orange" size={20} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="w-full sm:w-auto">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Pending Parcels
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1">
                {filteredSortedParcels.length} of {parcels.length} awaiting
                action
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SearchInput
                id="parcel-search"
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
                  ? "No pending parcels"
                  : "No parcels match your search"}
              </p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                {parcels.length === 0
                  ? "All parcels have been reviewed."
                  : "Try a different search or filter."}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {paginatedParcels.filter(Boolean).map((parcel) => {
                  const isOpen = expandedId === parcel._id;
                  return (
                    <div key={parcel._id}>
                      <button
                        onClick={() =>
                          setExpandedId(isOpen ? null : parcel._id)
                        }
                        className="lg:hidden w-full flex items-center justify-between p-4 hover:bg-gray-50 transition text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {parcel.parcelName}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              #{parcel._id.slice(-6)}
                            </p>
                          </div>
                          <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                            {parcel.status}
                          </span>
                        </div>
                        {isOpen ? (
                          <ChevronUp
                            size={18}
                            className="text-gray-400 shrink-0 ml-2"
                          />
                        ) : (
                          <ChevronDown
                            size={18}
                            className="text-gray-400 shrink-0 ml-2"
                          />
                        )}
                      </button>

                      {isOpen && (
                        <div className="lg:hidden px-4 pb-4">
                          <div className="border-t border-gray-100 pt-3 space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin
                                size={14}
                                className="shrink-0 text-gray-400"
                              />
                              <span>
                                <LocationName
                                  locationId={parcel.locationId}
                                  region={parcel.region}
                                />
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Ruler
                                size={14}
                                className="shrink-0 text-gray-400"
                              />
                              <span>{parcel.size} acres</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar
                                size={14}
                                className="shrink-0 text-gray-400"
                              />
                              <span>{formatDate(parcel.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              {parcel.managedType === "AGROVISTA_MANAGED" ? (
                                <>
                                  <Building2
                                    size={14}
                                    className="shrink-0 text-blue-500"
                                  />
                                  <span className="text-blue-700 font-medium">
                                    Agrovista managed
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Sprout
                                    size={14}
                                    className="shrink-0 text-purple-500"
                                  />
                                  <span className="text-purple-700 font-medium">
                                    User managed
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveClick(parcel);
                              }}
                              disabled={processing === parcel._id}
                              className="w-full px-4 py-2.5 rounded-xl bg-accent-green hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium"
                            >
                              {processing === parcel._id
                                ? "Processing..."
                                : "Approve"}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmAction({
                                  id: parcel._id,
                                  type: "reject",
                                });
                              }}
                              disabled={processing === parcel._id}
                              className="w-full px-4 py-2.5 rounded-xl bg-accent-red hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium"
                            >
                              {processing === parcel._id
                                ? "Processing..."
                                : "Reject"}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedContract(parcel);
                              }}
                              className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100 text-sm font-medium"
                            >
                              <span className="flex items-center justify-center gap-1.5">
                                <FileText size={16} /> Review Contract
                              </span>
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="hidden lg:flex items-center p-5 hover:bg-gray-50 transition">
                        <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {parcel?.parcelName}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              #{parcel?._id?.slice(-6)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin
                              size={14}
                              className="shrink-0 text-gray-400"
                            />
                            <span>
                              <LocationName
                                locationId={parcel?.locationId}
                                region={parcel?.region}
                              />
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Ruler
                              size={14}
                              className="shrink-0 text-gray-400"
                            />
                            <span>{parcel?.size} acres</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            {parcel?.managedType === "AGROVISTA_MANAGED" ? (
                              <>
                                <Building2
                                  size={14}
                                  className="shrink-0 text-blue-500"
                                />
                                <span className="text-blue-700 font-medium text-sm">
                                  Agrovista
                                </span>
                              </>
                            ) : (
                              <>
                                <Sprout
                                  size={14}
                                  className="shrink-0 text-purple-500"
                                />
                                <span className="text-purple-700 font-medium text-sm">
                                  User
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar
                              size={14}
                              className="shrink-0 text-gray-400"
                            />
                            <span>{formatDate(parcel?.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4 shrink-0">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                            {parcel?.status}
                          </span>
                          <button
                            onClick={() => parcel && handleApproveClick(parcel)}
                            disabled={!parcel || processing === parcel._id}
                            className="px-4 py-2 rounded-xl bg-accent-green hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium"
                          >
                            {processing === parcel?._id
                              ? "Processing..."
                              : "Approve"}
                          </button>
                          <button
                            onClick={() =>
                              parcel &&
                              setConfirmAction({
                                id: parcel._id,
                                type: "reject",
                              })
                            }
                            disabled={!parcel || processing === parcel._id}
                            className="px-4 py-2 rounded-xl bg-accent-red hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium"
                          >
                            {processing === parcel?._id
                              ? "Processing..."
                              : "Reject"}
                          </button>
                          <button
                            onClick={() =>
                              parcel && setSelectedContract(parcel)
                            }
                            className="px-4 py-2 rounded-xl border-2 border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100 text-sm font-medium"
                          >
                            <span className="flex items-center gap-1.5">
                              <FileText size={15} /> Contract
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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

      {selectedContract && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-4 sm:p-6 mx-auto max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Parcel Details
              </h2>
              <button
                onClick={() => setSelectedContract(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Parcel Name
                </p>
                <p className="text-gray-900 font-medium">
                  {selectedContract.parcelName}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Location
                </p>
                <p className="text-gray-900">
                  <LocationName
                    locationId={selectedContract.locationId}
                    region={selectedContract.region}
                  />
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Size
                </p>
                <p className="text-gray-900">{selectedContract.size} acres</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Status
                </p>
                <p className="text-accent-orange font-medium">
                  {selectedContract.status}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Submitted
                </p>
                <p className="text-gray-900">
                  {formatDate(selectedContract.createdAt)}
                </p>
              </div>
              {selectedContract.contract && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                    Contract Document
                  </p>
                  <a
                    href={selectedContract.contract.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 text-sm"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download PDF
                  </a>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedContract(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6 mx-auto max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Assign Moderator
              </h2>
              <button
                onClick={() => setShowAssignModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              This parcel is Agrovista managed. Select a moderator for{" "}
              <strong>{showAssignModal.parcelName}</strong> before approving.
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
                <p className="text-gray-500 font-medium text-sm">
                  No moderators found
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  No moderators available for this location.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  size={Math.min(5, moderators.length)}
                  value={selectedModeratorId || ""}
                  onChange={(e) =>
                    setSelectedModeratorId(e.target.value || null)
                  }
                  className="w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent p-1"
                >
                  <option value="">-- Select a moderator --</option>
                  {moderators.map((mod) => (
                    <option key={mod.id} value={mod.id} className="py-1">
                      {mod.firstName} {mod.lastName} ({mod.email})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() =>
                    selectedModeratorId &&
                    handleAssignAndApprove(selectedModeratorId)
                  }
                  disabled={!selectedModeratorId || assigning}
                  className="w-full px-4 py-2.5 rounded-xl bg-accent-green hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium"
                >
                  {assigning ? "Assigning & Approving..." : "Approve"}
                </button>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowAssignModal(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors duration-200 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmAction}
        title={
          confirmAction?.type === "approve" ? "Approve Parcel" : "Reject Parcel"
        }
        message={
          confirmAction?.type === "approve"
            ? "Are you sure you want to approve this parcel? This action cannot be undone."
            : "Are you sure you want to reject this parcel? This action cannot be undone."
        }
        confirmLabel={confirmAction?.type === "approve" ? "Approve" : "Reject"}
        variant={confirmAction?.type === "approve" ? "success" : "danger"}
        loading={processing === confirmAction?.id}
        onConfirm={
          confirmAction?.type === "approve" ? handleApprove : handleReject
        }
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
