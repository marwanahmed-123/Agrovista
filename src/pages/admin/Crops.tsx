import { useEffect, useMemo, useRef, useState } from "react";
import { cropService, type CreateCropData } from "../../services/cropService";
import type { Crop, Threshold } from "../../types";
import {
  Sprout,
  X,
  Plus,
  Calendar,
  Image as ImageIcon,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import SearchInput from "../../components/SearchInput";
import SortDropdown, { type SortOption } from "../../components/SortDropdown";
import Pagination from "../../components/Pagination";

const emptyThreshold: Threshold = {
  name: "",
  stage: 1,
  validFrom: 0,
  validTo: 100,
  soilElements: {
    N: { min: 0, max: 100, optimalMin: 50, optimalMax: 80 },
    P: { min: 0, max: 100, optimalMin: 50, optimalMax: 80 },
    K: { min: 0, max: 100, optimalMin: 50, optimalMax: 80 },
    ph: { min: 5, max: 9, optimalMin: 6.5, optimalMax: 7.5 },
    temperature: { min: 10, max: 40, optimalMin: 25, optimalMax: 35 },
    humidity: { min: 30, max: 90, optimalMin: 60, optimalMax: 80 },
    soilMoisture: { min: 0, max: 100, optimalMin: 50, optimalMax: 70 },
  },
};

type SortKey = "name-asc" | "name-desc" | "newest" | "oldest";

const sortOptions: SortOption<SortKey>[] = [
  { value: "name-asc", label: "Name A\u2013Z" },
  { value: "name-desc", label: "Name Z\u2013A" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

const soilLabels: Record<string, string> = {
  N: "Nitrogen (N)",
  P: "Phosphorus (P)",
  K: "Potassium (K)",
  ph: "pH",
  temperature: "Temperature",
  humidity: "Humidity",
  soilMoisture: "Soil Moisture",
};

export default function Crops() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCropForSchedule, setSelectedCropForSchedule] =
    useState<Crop | null>(null);
  const [viewingSchedules, setViewingSchedules] = useState<Crop | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name-asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateCropData>({
    name: "",
    description: "",
    thresholds: [{ ...emptyThreshold }],
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const REGIONS = [
    "DELTA",
    "NORTH_WEST",
    "NORTH_SINAI",
    "SOUTH_SINAI",
    "MIDDLE_EGYPT",
    "UPPER_EGYPT",
    "NEW_VALLEY",
    "TOSKA",
  ];

  const daysInMonth = (month: number) => new Date(2024, month, 0).getDate();

  const clampDay = (day: number, month: number) =>
    Math.min(day, daysInMonth(month));

  const scheduleFormRef = useRef<Record<string, typeof defaultScheduleForm>>({});

  const defaultScheduleForm = {
    regions: [] as string[],
    sowingEarlyDay: 1,
    sowingEarlyMonth: 1,
    sowingLateDay: 1,
    sowingLateMonth: 3,
    harvestEarlyDay: 1,
    harvestEarlyMonth: 6,
    harvestLateDay: 1,
    harvestLateMonth: 9,
    growingPeriodMin: 90,
    growingPeriodMax: 150,
  };

  const [, forceScheduleRender] = useState(0);

  function getScheduleForm() {
    const id = selectedCropForSchedule?._id;
    if (!id) return defaultScheduleForm;
    if (!scheduleFormRef.current[id]) {
      const existing = selectedCropForSchedule?.schedules;
      scheduleFormRef.current[id] = {
        regions: existing?.regions ?? [],
        sowingEarlyDay: existing?.sowing?.early?.day ?? 1,
        sowingEarlyMonth: existing?.sowing?.early?.month ?? 1,
        sowingLateDay: existing?.sowing?.late?.day ?? 1,
        sowingLateMonth: existing?.sowing?.late?.month ?? 3,
        harvestEarlyDay: existing?.harvest?.early?.day ?? 1,
        harvestEarlyMonth: existing?.harvest?.early?.month ?? 6,
        harvestLateDay: existing?.harvest?.late?.day ?? 1,
        harvestLateMonth: existing?.harvest?.late?.month ?? 9,
        growingPeriodMin: existing?.growingPeriodMin ?? 90,
        growingPeriodMax: existing?.growingPeriodMax ?? 150,
      };
    }
    return scheduleFormRef.current[id];
  }

  function updateScheduleForm(partial: Partial<typeof defaultScheduleForm>) {
    const id = selectedCropForSchedule?._id;
    if (!id) return;
    scheduleFormRef.current[id] = {
      ...getScheduleForm(),
      ...partial,
    };
    forceScheduleRender((t) => t + 1);
  }

  const scheduleForm = getScheduleForm();

  useEffect(() => {
    loadCrops();
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(t);
  }, [success]);

  const loadCrops = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cropService.getAllCrops();
      setCrops(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load crops");
    } finally {
      setLoading(false);
    }
  };

  const filteredSortedCrops = useMemo(() => {
    let result = crops.filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      );
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
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
        default:
          return 0;
      }
    });

    return result;
  }, [crops, searchQuery, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSortedCrops.length / pageSize),
  );
  const paginatedCrops = filteredSortedCrops.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (editingCrop) {
        await cropService.updateCrop(
          editingCrop._id,
          formData,
          selectedImage || undefined,
        );
        setSuccess("Crop updated successfully");
      } else {
        await cropService.createCrop(formData, selectedImage || undefined);
        setSuccess("Crop created successfully");
      }
      setShowModal(false);
      setEditingCrop(null);
      setSelectedImage(null);
      setFormData({
        name: "",
        description: "",
        thresholds: [{ ...emptyThreshold }],
      });
      loadCrops();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save crop");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSchedule = async () => {
    if (!selectedCropForSchedule) return;
    setSaving(true);
    setError(null);
    try {
      await cropService.addSchedule(selectedCropForSchedule._id, {
        regions: scheduleForm.regions,
        sowing: {
          early: {
            day: scheduleForm.sowingEarlyDay,
            month: scheduleForm.sowingEarlyMonth,
          },
          late: {
            day: scheduleForm.sowingLateDay,
            month: scheduleForm.sowingLateMonth,
          },
        },
        harvest: {
          early: {
            day: scheduleForm.harvestEarlyDay,
            month: scheduleForm.harvestEarlyMonth,
          },
          late: {
            day: scheduleForm.harvestLateDay,
            month: scheduleForm.harvestLateMonth,
          },
        },
        growingPeriodMin: scheduleForm.growingPeriodMin,
        growingPeriodMax: scheduleForm.growingPeriodMax,
      });
      setSuccess("Schedule added successfully");
      setShowScheduleModal(false);
      setSelectedCropForSchedule(null);
      loadCrops();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add schedule");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (crop: Crop) => {
    setEditingCrop(crop);
    setSelectedImage(null);
    setFormData({
      name: crop.name,
      description: crop.description || "",

      thresholds:
        crop.thresholds.length > 0
          ? JSON.parse(JSON.stringify(crop.thresholds))
          : [{ ...emptyThreshold }],
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingCrop(null);
    setSelectedImage(null);
    setFormData({
      name: "",
      description: "",
      thresholds: [{ ...emptyThreshold }],
    });
    setShowModal(true);
  };

  const handleThresholdChange = (index: number, field: string, value: any) => {
    const newThresholds = [...formData.thresholds];
    const parts = field.split(".");
    if (parts[0] === "soilElements" && parts.length >= 3) {
      const element = parts[1];
      const prop = parts[2];
      const num = Number(value);
      (newThresholds[index].soilElements as any)[element][prop] = isNaN(num)
        ? value
        : num;
    } else if (field === "name") {
      (newThresholds[index] as any)[field] = value;
    } else {
      const num = Number(value);
      (newThresholds[index] as any)[field] = isNaN(num) ? value : num;
    }
    setFormData({ ...formData, thresholds: newThresholds });
  };

  const addThreshold = () => {
    setFormData({
      ...formData,
      thresholds: [
        ...formData.thresholds,
        { ...emptyThreshold, name: "", stage: formData.thresholds.length + 1 },
      ],
    });
  };

  const removeThreshold = (index: number) => {
    if (formData.thresholds.length > 1) {
      setFormData({
        ...formData,
        thresholds: formData.thresholds.filter((_, i) => i !== index),
      });
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
        Loading crops...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB] p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
              Crop Management
            </h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              Manage crops, thresholds, and planting schedules.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent-green hover:bg-green-600 text-white text-sm font-medium transition-colors shrink-0"
          >
            <Plus size={18} /> Add New Crop
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-red-50 border border-red-100 p-4 text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-2xl bg-green-50 border border-green-100 p-4 text-green-700 text-sm">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:gap-5 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-400 font-medium">
                  TOTAL CROPS
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
                  {crops.length}
                </h2>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-green-100 flex items-center justify-center">
                <Sprout className="text-accent-green" size={20} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="w-full sm:w-auto">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                All Crops
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1">
                {filteredSortedCrops.length} of {crops.length} crops
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SearchInput
                id="crop-search"
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search crops..."
              />
              <SortDropdown
                options={sortOptions}
                value={sortBy}
                onChange={setSortBy}
              />
            </div>
          </div>

          {paginatedCrops.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Sprout className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-500 font-medium text-sm sm:text-base">
                {crops.length === 0
                  ? "No crops found"
                  : "No crops match your search"}
              </p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                {crops.length === 0
                  ? "Create your first crop to get started."
                  : "Try a different search or filter."}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {paginatedCrops.map((crop) => {
                  const isOpen = expandedId === crop._id;
                  const imageUrl = crop.image?.url;
                  return (
                    <div key={crop._id}>
                      <button
                        onClick={() => setExpandedId(isOpen ? null : crop._id)}
                        className="lg:hidden w-full flex items-center justify-between p-4 hover:bg-gray-50 transition text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={crop.name}
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                              <Sprout size={18} className="text-accent-green" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {crop.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              ${crop.acreProfit}/acre
                            </p>
                          </div>
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
                            {crop.description && (
                              <p className="text-sm text-gray-600">
                                {crop.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar
                                size={14}
                                className="shrink-0 text-gray-400"
                              />
                              <span>
                                Thresholds: {crop.thresholds?.length || 0}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">
                              Created {formatDate(crop.createdAt)}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(crop);
                              }}
                              className="w-full px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium"
                            >
                              <span className="flex items-center justify-center gap-1.5">
                                <ImageIcon size={16} /> Edit Crop
                              </span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCropForSchedule(crop);
                                setShowScheduleModal(true);
                              }}
                              className="w-full px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium"
                            >
                              <span className="flex items-center justify-center gap-1.5">
                                <Calendar size={16} /> Add Schedule
                              </span>
                            </button>
                            {crop.schedules && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingSchedules(crop);
                                }}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-purple-500 text-purple-700 bg-purple-50 hover:bg-purple-100 text-sm font-medium"
                              >
                                <span className="flex items-center justify-center gap-1.5">
                                  <Clock size={16} /> View Schedules
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="hidden lg:flex items-center p-5 hover:bg-gray-50 transition">
                        <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                          <div className="flex items-center gap-3 min-w-0 col-span-2">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={crop.name}
                                className="w-10 h-10 rounded-lg object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                <Sprout
                                  size={18}
                                  className="text-accent-green"
                                />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">
                                {crop.name}
                              </p>
                              {crop.description && (
                                <p className="text-xs text-gray-400 truncate">
                                  {crop.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium text-accent-green">
                              ${crop.acreProfit}
                            </span>
                            /acre
                          </div>
                          <div className="text-sm text-gray-600">
                            {crop.thresholds?.length || 0} stages
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => openEditModal(crop)}
                              className="px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium"
                            >
                              <span className="flex items-center gap-1.5">
                                <ImageIcon size={15} /> Edit
                              </span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCropForSchedule(crop);
                                setShowScheduleModal(true);
                              }}
                              className="px-3 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium"
                            >
                              <span className="flex items-center gap-1.5">
                                <Calendar size={15} /> Schedule
                              </span>
                            </button>
                            {crop.schedules && (
                              <button
                                onClick={() => setViewingSchedules(crop)}
                                className="px-3 py-2 rounded-xl border-2 border-purple-500 text-purple-700 bg-purple-50 hover:bg-purple-100 text-sm font-medium"
                              >
                                <span className="flex items-center gap-1.5">
                                  <Clock size={15} /> View
                                </span>
                              </button>
                            )}
                          </div>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-4 sm:p-6 mx-auto max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {editingCrop ? "Edit Crop" : "Create New Crop"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Crop Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-green focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Acre Profit ($)
                  </label>
                  <input
                    type="number"
                    value={formData.acreProfit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        acreProfit: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-green focus:border-transparent text-sm"
                    required
                    min={0}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-green focus:border-transparent text-sm"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Crop Image{" "}
                  {!editingCrop && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setSelectedImage(e.target.files?.[0] || null)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                {editingCrop && editingCrop.image?.url && (
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to keep existing image.
                  </p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Thresholds
                  </label>
                  <button
                    type="button"
                    onClick={addThreshold}
                    className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                  >
                    + Add Threshold
                  </button>
                </div>
                {formData.thresholds.map((threshold, index) => (
                  <div
                    key={index}
                    className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          placeholder="Stage Name"
                          value={threshold.name}
                          onChange={(e) =>
                            handleThresholdChange(index, "name", e.target.value)
                          }
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm flex-1"
                          required
                        />
                        {formData.thresholds.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeThreshold(index)}
                            className="text-red-500 text-xs font-medium hover:text-red-600 shrink-0"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                      <div>
                        <label className="text-xs text-gray-500">Stage</label>
                        <input
                          type="number"
                          value={threshold.stage}
                          onChange={(e) =>
                            handleThresholdChange(
                              index,
                              "stage",
                              e.target.value,
                            )
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                          min={1}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">
                          Valid From (day)
                        </label>
                        <input
                          type="number"
                          value={threshold.validFrom}
                          onChange={(e) =>
                            handleThresholdChange(
                              index,
                              "validFrom",
                              e.target.value,
                            )
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                          min={0}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">
                          Valid To (day)
                        </label>
                        <input
                          type="number"
                          value={threshold.validTo}
                          onChange={(e) =>
                            handleThresholdChange(
                              index,
                              "validTo",
                              e.target.value,
                            )
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                          min={0}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-5 gap-2 text-xs text-gray-500 font-medium pb-1">
                        <span></span>
                        <span>Min</span>
                        <span>Max</span>
                        <span>Optimal Min</span>
                        <span>Optimal Max</span>
                      </div>
                      {Object.keys(emptyThreshold.soilElements).map((el) => {
                        const elem =
                          threshold.soilElements[
                            el as keyof typeof threshold.soilElements
                          ];
                        return (
                          <div
                            key={el}
                            className="grid grid-cols-5 gap-2 items-center text-xs"
                          >
                            <span className="text-gray-600 font-medium">
                              {soilLabels[el] || el}
                            </span>
                            <input
                              type="number"
                              step="any"
                              value={elem.min}
                              placeholder="Min"
                              onChange={(e) =>
                                handleThresholdChange(
                                  index,
                                  `soilElements.${el}.min`,
                                  e.target.value,
                                )
                              }
                              className="px-2 py-1.5 border border-gray-300 rounded-lg"
                            />
                            <input
                              type="number"
                              step="any"
                              value={elem.max}
                              placeholder="Max"
                              onChange={(e) =>
                                handleThresholdChange(
                                  index,
                                  `soilElements.${el}.max`,
                                  e.target.value,
                                )
                              }
                              className="px-2 py-1.5 border border-gray-300 rounded-lg"
                            />
                            <input
                              type="number"
                              step="any"
                              value={elem.optimalMin ?? ""}
                              placeholder="Optimal min"
                              onChange={(e) =>
                                handleThresholdChange(
                                  index,
                                  `soilElements.${el}.optimalMin`,
                                  e.target.value,
                                )
                              }
                              className="px-2 py-1.5 border border-gray-300 rounded-lg"
                            />
                            <input
                              type="number"
                              step="any"
                              value={elem.optimalMax ?? ""}
                              placeholder="Optimal max"
                              onChange={(e) =>
                                handleThresholdChange(
                                  index,
                                  `soilElements.${el}.optimalMax`,
                                  e.target.value,
                                )
                              }
                              className="px-2 py-1.5 border border-gray-300 rounded-lg"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-accent-green hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
                >
                  {saving
                    ? "Saving..."
                    : editingCrop
                      ? "Update Crop"
                      : "Create Crop"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-4 sm:p-6 mx-auto max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {selectedCropForSchedule?.schedules
                  ? "Edit Schedule"
                  : "Add Schedule"}
              </h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              {selectedCropForSchedule?.schedules
                ? "Update the planting schedule for"
                : "Add a planting schedule for"}{" "}
              <strong>{selectedCropForSchedule?.name}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <p className="block text-sm font-medium text-gray-700 mb-2">
                  Regions
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {REGIONS.map((r) => (
                    <label
                      key={r}
                      className="flex items-center text-sm text-gray-700 cursor-pointer hover:text-purple-700 w-fit"
                    >
                      <input
                        type="checkbox"
                        style={{
                          width: "16px",
                          height: "16px",
                        }}
                        checked={scheduleForm.regions.includes(r)}
                        onChange={() =>
                          updateScheduleForm({
                            regions: scheduleForm.regions.includes(r)
                              ? scheduleForm.regions.filter((x) => x !== r)
                              : [...scheduleForm.regions, r],
                          })
                        }
                        className="accent-purple-600 rounded w-fit h-4 shrink-0 mr-1.5"
                      />
                      <span className="flex-1 min-w-0">
                        {r.replace(/_/g, " ")}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sowing Early
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={scheduleForm.sowingEarlyDay}
                      onChange={(e) =>
                        updateScheduleForm({
                          sowingEarlyDay: clampDay(
                            Number(e.target.value),
                            scheduleForm.sowingEarlyMonth,
                          ),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min={1}
                      max={31}
                    />
                    <input
                      type="number"
                      value={scheduleForm.sowingEarlyMonth}
                      onChange={(e) => {
                        const m = Number(e.target.value);
                        updateScheduleForm({
                          
                          sowingEarlyMonth: m,
                          sowingEarlyDay: clampDay(
                            scheduleForm.sowingEarlyDay,
                            m,
                          ),
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min={1}
                      max={12}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sowing Late
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={scheduleForm.sowingLateDay}
                      onChange={(e) =>
                        updateScheduleForm({
                          
                          sowingLateDay: clampDay(
                            Number(e.target.value),
                            scheduleForm.sowingLateMonth,
                          ),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min={1}
                      max={31}
                    />
                    <input
                      type="number"
                      value={scheduleForm.sowingLateMonth}
                      onChange={(e) => {
                        const m = Number(e.target.value);
                        updateScheduleForm({
                          
                          sowingLateMonth: m,
                          sowingLateDay: clampDay(
                            scheduleForm.sowingLateDay,
                            m,
                          ),
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min={1}
                      max={12}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harvest Early
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={scheduleForm.harvestEarlyDay}
                      onChange={(e) =>
                        updateScheduleForm({
                          
                          harvestEarlyDay: clampDay(
                            Number(e.target.value),
                            scheduleForm.harvestEarlyMonth,
                          ),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min={1}
                      max={31}
                    />
                    <input
                      type="number"
                      value={scheduleForm.harvestEarlyMonth}
                      onChange={(e) => {
                        const m = Number(e.target.value);
                        updateScheduleForm({
                          
                          harvestEarlyMonth: m,
                          harvestEarlyDay: clampDay(
                            scheduleForm.harvestEarlyDay,
                            m,
                          ),
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min={1}
                      max={12}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harvest Late
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={scheduleForm.harvestLateDay}
                      onChange={(e) =>
                        updateScheduleForm({
                          
                          harvestLateDay: clampDay(
                            Number(e.target.value),
                            scheduleForm.harvestLateMonth,
                          ),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min={1}
                      max={31}
                    />
                    <input
                      type="number"
                      value={scheduleForm.harvestLateMonth}
                      onChange={(e) => {
                        const m = Number(e.target.value);
                        updateScheduleForm({
                          
                          harvestLateMonth: m,
                          harvestLateDay: clampDay(
                            scheduleForm.harvestLateDay,
                            m,
                          ),
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min={1}
                      max={12}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Growing Period Min (days)
                  </label>
                  <input
                    type="number"
                    value={scheduleForm.growingPeriodMin}
                    onChange={(e) =>
                      updateScheduleForm({
                        
                        growingPeriodMin: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Growing Period Max (days)
                  </label>
                  <input
                    type="number"
                    value={scheduleForm.growingPeriodMax}
                    onChange={(e) =>
                      updateScheduleForm({
                        
                        growingPeriodMax: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    min={1}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSchedule}
                  disabled={saving}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
                >
                  {saving
                    ? "Saving..."
                    : selectedCropForSchedule?.schedules
                      ? "Save Schedule"
                      : "Add Schedule"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingSchedules && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-4 sm:p-6 mx-auto max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Schedules for {viewingSchedules.name}
              </h2>
              <button
                onClick={() => setViewingSchedules(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>
            {viewingSchedules.schedules ? (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={16} className="text-purple-500" />
                  <span className="font-medium text-gray-900 text-sm">
                    Schedule
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Regions</p>
                    <p className="text-gray-700">
                      {viewingSchedules.schedules.regions?.join(", ") || "\u2014"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Growing Period</p>
                    <p className="text-gray-700">
                      {viewingSchedules.schedules.growingPeriodMin || "\u2014"}
                      {viewingSchedules.schedules.growingPeriodMin ? "\u2013" : ""}
                      {viewingSchedules.schedules.growingPeriodMax
                        ? `${viewingSchedules.schedules.growingPeriodMax} days`
                        : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Sowing Window</p>
                    <p className="text-gray-700">
                      {viewingSchedules.schedules.sowing?.early
                        ? `${viewingSchedules.schedules.sowing.early.day}/${viewingSchedules.schedules.sowing.early.month}`
                        : "\u2014"}
                      {" \u2013 "}
                      {viewingSchedules.schedules.sowing?.late
                        ? `${viewingSchedules.schedules.sowing.late.day}/${viewingSchedules.schedules.sowing.late.month}`
                        : "\u2014"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Harvest Window</p>
                    <p className="text-gray-700">
                      {viewingSchedules.schedules.harvest?.early
                        ? `${viewingSchedules.schedules.harvest.early.day}/${viewingSchedules.schedules.harvest.early.month}`
                        : "\u2014"}
                      {" \u2013 "}
                      {viewingSchedules.schedules.harvest?.late
                        ? `${viewingSchedules.schedules.harvest.late.day}/${viewingSchedules.schedules.harvest.late.month}`
                        : "\u2014"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  No schedules for this crop.
                </p>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingSchedules(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
