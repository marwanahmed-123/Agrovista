import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { locationService, Governorate, City } from '../services/locationService';
import type { CreateParcelData } from '../services/parcelService';

interface ParcelFormProps {
  initialData?: Partial<CreateParcelData>;
  onSubmit: (data: CreateParcelData) => Promise<void>;
  isLoading?: boolean;
}

export default function ParcelForm({ initialData, onSubmit, isLoading = false }: ParcelFormProps) {
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedGov, setSelectedGov] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    locationService.getGovernorates().then(setGovernorates).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedGov) {
      locationService.getCities(selectedGov).then(setCities).catch(console.error);
    } else {
      setCities([]);
    }
  }, [selectedGov]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateParcelData>({
    defaultValues: initialData,
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setContractFile(file);
      setError(null);
    }
  };

  const handleFormSubmit = async (data: CreateParcelData) => {
    try {
      setError(null);
      
      await onSubmit({
        ...data,
        contract: contractFile || undefined,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create parcel');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="parcelName" className="block text-sm font-medium text-gray-700 mb-2">
          Parcel Name
        </label>
        <input
          id="parcelName"
          type="text"
          placeholder="Enter parcel name"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          {...register('parcelName', {
            required: 'Parcel name is required',
            minLength: { value: 1, message: 'Parcel name is required' },
          })}
        />
        {errors.parcelName && (
          <p className="text-red-500 text-xs mt-1">{errors.parcelName.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="governorate" className="block text-sm font-medium text-gray-700 mb-2">
          Governorate
        </label>
        <select
          id="governorate"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          onChange={(e) => {
            setSelectedGov(e.target.value);
          }}
        >
          <option value="">Select Governorate</option>
          {governorates.map((gov) => (
            <option key={gov._id} value={gov._id}>
              {gov.nameEn}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="locationId" className="block text-sm font-medium text-gray-700 mb-2">
          City
        </label>
        <select
          id="locationId"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          {...register('locationId', { required: 'City is required' })}
          disabled={!selectedGov}
        >
          <option value="">Select City</option>
          {cities.map((city) => (
            <option key={city._id} value={city._id}>
              {city.nameEn}
            </option>
          ))}
        </select>
        {errors.locationId && (
          <p className="text-red-500 text-xs mt-1">{errors.locationId.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
          Size (acres)
        </label>
        <input
          id="size"
          type="number"
          placeholder="Enter size in acres"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          {...register('size', {
            required: 'Size is required',
            min: { value: 0.1, message: 'Size must be greater than 0' },
            valueAsNumber: true,
          })}
        />
        {errors.size && (
          <p className="text-red-500 text-xs mt-1">{errors.size.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="currentCropName" className="block text-sm font-medium text-gray-700 mb-2">
          Current Crop (Optional)
        </label>
        <input
          id="currentCropName"
          type="text"
          placeholder="Enter current crop name"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          {...register('currentCropName')}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="contract" className="block text-sm font-medium text-gray-700 mb-2">
          Contract Document (Optional)
        </label>
        <input
          ref={fileInputRef}
          id="contract"
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary-dark"
        />
        {contractFile && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm text-gray-600">
              Selected: {contractFile.name}
            </span>
            <button
              type="button"
              onClick={() => {
                setContractFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-70 mt-4"
      >
        {isLoading ? 'Processing...' : initialData ? 'Update Parcel' : 'Create Parcel'}
      </button>
    </form>
  );
}