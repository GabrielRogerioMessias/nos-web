export interface AuthResponse {
  token: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
}
