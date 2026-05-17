export interface User {
  id: string;
  email: string;
  fullName: string;
  status: string;
  locked: boolean;
  mustChangePassword: boolean;
  failedLoginAttempts: number;
  roles: string[];
  active: boolean;
  createdAt: string;
  createdBy: string;
}

export interface CreateUserRequest {
  email: string;
  fullName: string;
  password: string;
  roleIds: string[];
}
