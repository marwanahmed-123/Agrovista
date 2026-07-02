import api from "./api";
import { Parcel } from "../types";

function normalizeParcel(p: any): Parcel {
  return {
    ...p,
    _id: p._id || p.id,
  };
}

export interface CreateParcelData {
  parcelName: string;
  locationId: string;
  size: number;
  currentCropName?: string;
  currentCropId?: string;
  plantedOn?: string;
  contract?: File;
}

interface UpdateParcelData {
  parcelName?: string;
  locationId?: string;
  size?: number;
  currentCropName?: string;
  contract?: File;
}

export const parcelService = {
  async createParcel(data: CreateParcelData): Promise<Parcel> {
    const formData = new FormData();
    formData.append("parcelName", data.parcelName);
    formData.append("locationId", data.locationId);
    formData.append("size", String(data.size));
    if (data.currentCropName) {
      formData.append("currentCropName", data.currentCropName);
    }
    if (data.currentCropId) {
      formData.append("currentCropId", data.currentCropId);
    }
    if (data.plantedOn) {
      formData.append("plantedOn", data.plantedOn);
    }
    if (data.contract) {
      formData.append("contract", data.contract);
    }

    const response = await api.post<Parcel>("/parcels", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return normalizeParcel(response.data);
  },

  async updateParcel(id: string, data: UpdateParcelData): Promise<Parcel> {
    const formData = new FormData();
    if (data.parcelName) formData.append("parcelName", data.parcelName);
    if (data.locationId) formData.append("locationId", data.locationId);
    if (data.size) formData.append("size", String(data.size));
    if (data.currentCropName)
      formData.append("currentCropName", data.currentCropName);
    if (data.contract) formData.append("contract", data.contract);

    const response = await api.patch<Parcel>(`/parcels/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return normalizeParcel(response.data);
  },

  async deleteParcel(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/parcels/${id}`);
    return response.data;
  },

  async getPendingParcels(): Promise<Parcel[]> {
    const response = await api.get<Parcel[]>("/parcels/pending");
    return response.data.filter(Boolean).map(normalizeParcel);
  },

  async getApprovedParcels(): Promise<Parcel[]> {
    const response = await api.get<Parcel[]>("/parcels/approved");
    return response.data.filter(Boolean).map(normalizeParcel);
  },

  async getAllParcels(): Promise<Parcel[]> {
    const response = await api.get<Parcel[]>("/parcels");
    return response.data.filter(Boolean).map(normalizeParcel);
  },

  async getParcelById(id: string): Promise<Parcel> {
    const response = await api.get<Parcel>(`/parcels/${id}`);
    return normalizeParcel(response.data);
  },

  async approveParcel(id: string): Promise<{ message: string }> {
    const response = await api.patch<{ message: string }>(
      `/parcels/${id}/approve`,
    );
    return response.data;
  },

  async rejectParcel(id: string): Promise<{ message: string }> {
    const response = await api.patch<{ message: string }>(
      `/parcels/${id}/reject`,
    );
    return response.data;
  },

  async assignModerator(
    parcelId: string,
    moderatorId: string,
  ): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
      `/parcels/${parcelId}/assign-moderator`,
      { moderatorId },
    );
    return response.data;
  },

  async assignCrop(
    parcelId: string,
    cropId: string,
    plantedOn?: string,
  ): Promise<Parcel> {
    const response = await api.patch<Parcel>(`/parcels/${parcelId}/crop`, {
      cropId,
      ...(plantedOn ? { plantedOn } : {}),
    });
    return normalizeParcel(response.data);
  },
};
