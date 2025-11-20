export enum UserRole {
  CUSTOMER = "customer",
  ADMIN = "admin",
}

export interface User {
  id: string;
  email: string;
  name: string;
  password: string; // hashed
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithoutPassword {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface SignupRequest {
  email: string;
  name: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserWithoutPassword;
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: "access" | "refresh";
}


