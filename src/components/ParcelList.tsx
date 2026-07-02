import { Link } from 'react-router-dom';
import { Parcel } from '../types';
import { LocationName } from '../hooks/useLocationName';

interface ParcelListProps {
  parcels: Parcel[];
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export default function ParcelList({ parcels, onDelete, showActions = true }: ParcelListProps) {
  const getStatusBadge = (status: Parcel['status']) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Approved</span>;
      case 'REJECTED':
        return <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Rejected</span>;
      case 'PENDING':
        return <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Pending</span>;
      default:
        return null;
    }
  };

  if (parcels.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 text-center">
        <p className="text-gray-500">
          No parcels found. Create your first parcel to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {parcels.map((parcel) => (
        <div key={parcel._id} className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{parcel.parcelName}</h3>
                {getStatusBadge(parcel.status)}
              </div>
              <p className="text-gray-500 text-sm">
                <span className="hidden sm:inline">Location: <LocationName locationId={parcel.locationId} region={parcel.region} /> | Size: {parcel.size} acres</span>
                <span className="sm:hidden"><LocationName locationId={parcel.locationId} region={parcel.region} />, {parcel.size} acres</span>
                {parcel.currentCrop && ` | Current Crop: ${parcel.currentCrop.cropName}`}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Created: {new Date(parcel.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-row sm:flex-row gap-2 sm:gap-3">
              <Link
                to={`/parcels/${parcel._id}`}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 text-sm"
              >
                View
              </Link>
              {showActions && onDelete && (
                <button
                  onClick={() => onDelete(parcel._id)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors duration-200 text-sm"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}