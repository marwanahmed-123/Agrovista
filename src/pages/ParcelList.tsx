import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { parcelService } from "../services/parcelService";
import ParcelList from "../components/ParcelList";
import ConfirmModal from "../components/ConfirmModal";
import type { Parcel } from "../types";

export default function ParcelListPage() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    loadParcels();
  }, []);

  const loadParcels = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await parcelService.getAllParcels();
      setParcels(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load parcels");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setError(null);
    try {
      await parcelService.deleteParcel(deleteTarget);
      setParcels(parcels.filter((p) => p && p._id !== deleteTarget));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete parcel");
    } finally {
      setDeleteTarget(null);
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
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          My Parcels
        </h1>
        <Link
          to="/parcels/create"
          className="bg-primary hover:bg-primary-dark text-white font-medium py-2.5 px-5 rounded-lg transition-colors duration-200 text-sm sm:text-base"
        >
          Create Parcel
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <ParcelList
        parcels={parcels}
        onDelete={(id) => setDeleteTarget(id)}
        showActions={true}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Parcel"
        message="Are you sure you want to delete this parcel? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
