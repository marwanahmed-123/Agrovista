import api from "./api";

export interface Governorate {
  _id: string;
  nameEn: string;
  nameAr: string;
}

export interface City {
  _id: string;
  parentId: string;
  nameEn: string;
  nameAr: string;
  lat: number;
  lon: number;
}

export const locationService = {
  async getGovernorates(): Promise<Governorate[]> {
    const response = await api.get<Governorate[]>("/locations/gov");
    return response.data;
  },

  async getCities(govId: string): Promise<City[]> {
    const response = await api.get<City[]>("/locations/cities", {
      params: { "gov-id": govId },
    });
    return response.data;
  },
};