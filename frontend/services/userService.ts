import { User, UserRole, Permission } from '../types/auth';

export interface IUserService {
  getUserProfile(userId: string): Promise<User>;
  updateUserProfile(userId: string, data: Partial<User>): Promise<User>;
  getUsersList(): Promise<User[]>;
  createUser(data: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  updateUserRoleAndPermissions(userId: string, role: UserRole, permissions: Permission[]): Promise<User>;
}

export class UserService implements IUserService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
  }

  async getUserProfile(userId: string): Promise<User> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/users/${userId}`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch user profile');
      return await response.json();
    } catch (err) {
      console.error(`Error in getUserProfile for id ${userId}:`, err);
      throw err;
    }
  }

  async updateUserProfile(userId: string, data: Partial<User>): Promise<User> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/users/${userId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update user profile');
      return await response.json();
    } catch (err) {
      console.error(`Error in updateUserProfile for id ${userId}:`, err);
      throw err;
    }
  }

  async getUsersList(): Promise<User[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/users`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch users list');
      return await response.json();
    } catch (err) {
      console.error('Error in getUsersList:', err);
      throw err;
    }
  }

  async createUser(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/users`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create user');
      return await response.json();
    } catch (err) {
      console.error('Error in createUser:', err);
      throw err;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/users/${userId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete user');
    } catch (err) {
      console.error(`Error in deleteUser for id ${userId}:`, err);
      throw err;
    }
  }

  async updateUserRoleAndPermissions(
    userId: string,
    role: UserRole,
    permissions: Permission[]
  ): Promise<User> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/users/${userId}/role-permissions`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ role, permissions }),
      });
      if (!response.ok) throw new Error('Failed to update user role and permissions');
      return await response.json();
    } catch (err) {
      console.error(`Error in updateUserRoleAndPermissions for id ${userId}:`, err);
      throw err;
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('vt_auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }
}

export const userService = new UserService();
