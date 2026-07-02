import api from './api';
import type { User } from '../types';

function normalizeUser(raw: any): User {
  return {
    id: raw.id || raw._id || '',
    firstName: raw.firstName || '',
    lastName: raw.lastName || '',
    email: raw.email || '',
    phoneNumber: raw.phoneNumber,
    role: raw.role || 'USER',
    status: raw.status || 'ACTIVE',
    isVerified: raw.IsVerified === true,
  };
}

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const response = await api.get<any[]>('/users');
    return response.data.map(normalizeUser);
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<any>('/users/me');
    return normalizeUser(response.data);
  },

  async updateUserStatus(
    id: string,
    status: 'ACTIVE' | 'SUSPENDED'
  ): Promise<{ message: string }> {
    const response = await api.patch<{ message: string }>(`/users/update-status/${id}`, { status });
    return response.data;
  },

  async getUserById(id: string): Promise<User | null> {
    const users = await this.getAllUsers();
    return users.find((u) => u.id === id) ?? null;
  },

  async createAdmin(data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  }): Promise<{ admin: any; tempPassword: string }> {
    const response = await api.post('/users/create-admin', data);
    return response.data;
  },

  async discoverModerators(parcelId: string): Promise<User[]> {
    const response = await api.get<any[]>('/users/moderators/discover', {
      params: { parcelId },
    });
    return response.data.map(normalizeUser);
  },
};