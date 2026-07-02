export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: "SUPER_ADMIN" | "ADMIN" | "USER";
  status: "ACTIVE" | "PENDING_FOR_VERIFICATION" | "SUSPENDED";
  isVerified: boolean;
}

export interface Parcel {
  _id: string;
  parcelName: string;
  locationId: string;
  /** @deprecated old records use region instead of locationId */
  region?: string;
  size: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  currentCrop?: {
    cropId: string;
    cropName: string;
    plantedOn?: string;
  } | null;
  ownerId: string;
  moderatorId?: string | null;
  managedType?: "SELF_MANAGED" | "AGROVISTA_MANAGED";
  contract?: {
    documentId: string;
    fileUrl: string;
  } | null;
  cropHistory: Array<{
    cropId: string;
    cropName: string;
    plantedOn: string;
    harvestedOn?: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  message: string;
  mustChangePassword: boolean;
  user: User;
}

export interface DatePoint {
  day: number;
  month: number;
}

export interface SowingDates {
  early: DatePoint;
  late: DatePoint;
}

export interface HarvestDates {
  early: DatePoint;
  late: DatePoint;
}

export interface Schedule {
  regions: string[];
  sowing: SowingDates;
  harvest: HarvestDates;
  growingPeriodMin?: number;
  growingPeriodMax?: number;
}

export interface SoilElementValue {
  min: number;
  max: number;
  optimalMin: number;
  optimalMax?: number;
  optimal?: number;
}

export interface SoilElements {
  N: SoilElementValue;
  P: SoilElementValue;
  K: SoilElementValue;
  ph: SoilElementValue;
  temperature: SoilElementValue;
  humidity: SoilElementValue;
  soilMoisture: SoilElementValue;
}

export interface Threshold {
  name: string;
  stage: number;
  validFrom: number;
  validTo: number;
  soilElements: SoilElements;
}

export interface Crop {
  _id: string;
  name: string;
  description?: string;
  acreProfit: number;
  image?: {
    id: string;
    url: string;
  };
  schedules?: Schedule;
  thresholds: Threshold[];
  createdAt: string;
  updatedAt: string;
}
