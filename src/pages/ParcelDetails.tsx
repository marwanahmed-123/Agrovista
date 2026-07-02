import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { parcelService } from "../services/parcelService";
import { Parcel } from "../types";
import ConfirmModal from "../components/ConfirmModal";
import { LocationName } from "../hooks/useLocationName";

export default function ParcelDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadParcel(id);
    }
  }, [id]);

  const loadParcel = async (parcelId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await parcelService.getParcelById(parcelId);
      setParcel(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load parcel");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    setDeleting(true);
    setError(null);
    try {
      await parcelService.deleteParcel(id);
      navigate("/parcels");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete parcel");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getStatusBadge = (status: Parcel["status"]) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            Rejected
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-50 text-gray-500">
        Loading parcel...
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Parcel Not Found
        </h1>
        <p className="text-gray-500 mb-6">
          Parcel not found or has been deleted.
        </p>
        <Link
          to="/parcels"
          className="bg-primary hover:bg-primary-dark text-white font-medium py-2.5 px-5 rounded-lg transition-colors duration-200 inline-block"
        >
          Back to Parcels
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/parcels"
          className="text-primary hover:text-primary-dark font-medium text-sm"
        >
          ← Back to Parcels
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {parcel.parcelName}
            </h1>
            {getStatusBadge(parcel.status)}
          </div>
          <div className="flex flex-row sm:flex-row gap-2 sm:gap-3">
            <Link
              to={`/parcels/${parcel._id}/edit`}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 text-sm"
            >
              Edit
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors duration-200 text-sm disabled:opacity-70"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <p className="text-gray-500 text-sm mb-1">Location</p>
            <p className="text-lg font-medium text-gray-900">
              <LocationName locationId={parcel.locationId} region={parcel.region} />
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Size</p>
            <p className="text-lg font-medium text-gray-900">
              {parcel.size} acres
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Current Crop</p>
            <p className="text-lg font-medium text-gray-900">
              {parcel.currentCrop?.cropName || "None"}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Created</p>
            <p className="text-lg font-medium text-gray-900">
              {new Date(parcel.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {parcel.cropHistory && parcel.cropHistory.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Crop History
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 sm:px-4 text-gray-500 text-sm font-medium">
                      Crop
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-gray-500 text-sm font-medium">
                      Planted On
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-gray-500 text-sm font-medium">
                      Harvested On
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parcel.cropHistory.map((record, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-2 sm:px-4">{record.cropName}</td>
                      <td className="py-3 px-2 sm:px-4">
                        {new Date(record.plantedOn).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        {record.harvestedOn
                          ? new Date(record.harvestedOn).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={showDeleteModal}
        title="Delete Parcel"
        message="Are you sure you want to delete this parcel? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
