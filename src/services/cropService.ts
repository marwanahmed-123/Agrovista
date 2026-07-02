import api from "./api";
import type { Crop, Threshold, SowingDates, HarvestDates } from "../types";

export interface CreateCropData {
  name: string;
  description?: string;
  acreProfit?: number;
  thresholds: Threshold[];
}

interface UpdateCropData {
  name?: string;
  description?: string;
  acreProfit?: number;
  thresholds?: Threshold[];
}

interface AddScheduleData {
  regions: string[];
  sowing: SowingDates;
  harvest: HarvestDates;
  growingPeriodMin?: number;
  growingPeriodMax?: number;
}

export const cropService = {
  async getAllCrops(): Promise<Crop[]> {
    const response = await api.get<Crop[]>("/crops");
    return response.data;
  },

  async getCropById(id: string): Promise<Crop> {
    const response = await api.get<Crop>(`/crops/${id}`);
    return response.data;
  },

  async createCrop(data: CreateCropData, image?: File): Promise<Crop> {
    const formData = new FormData();
    formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);
    if (data.acreProfit !== undefined) formData.append("acreProfit", String(data.acreProfit));
    formData.append("thresholds", JSON.stringify(data.thresholds));
    if (image) formData.append("image", image);

    const response = await api.post<Crop>("/crops/create-crop", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async updateCrop(id: string, data: UpdateCropData, image?: File): Promise<Crop> {
    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);
    if (data.acreProfit !== undefined) formData.append("acreProfit", String(data.acreProfit));
    if (data.thresholds) formData.append("thresholds", JSON.stringify(data.thresholds));
    if (image) formData.append("image", image);

    const response = await api.patch<Crop>(`/crops/update-crop/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async addSchedule(id: string, data: AddScheduleData): Promise<Crop> {
    const response = await api.post<Crop>(`/crops/${id}/add-schedule`, data);
    return response.data;
  },
};