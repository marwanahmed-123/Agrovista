import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ParcelForm from '../components/ParcelForm';
import { parcelService, CreateParcelData } from '../services/parcelService';

export default function CreateParcel() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateParcelData) => {
    setIsLoading(true);
    setError(null);
    try {
      await parcelService.createParcel(data);
      navigate('/parcels');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create parcel');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link to="/parcels" className="text-primary hover:text-primary-dark font-medium text-sm">
          ← Back to Parcels
        </Link>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Create New Parcel</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 max-w-2xl">
        <ParcelForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}