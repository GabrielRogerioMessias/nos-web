export interface UserResponse {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  termsAccepted: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
  warning?: string;
}
