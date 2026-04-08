export interface GoalVault {
  id: string;
  currentBalance: number;
  account?: { id: string; name: string; bankName: string; color: string };
}

export interface GoalProjection {
  projectedMonths: number;
  projectedDate: string; // ISO date
}

export interface GoalResponse {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  targetDate?: string; // ISO date
  monthlyContribution?: number;
  yieldRatePercent?: number;
  achieved: boolean;
  achievedAt?: string; // ISO date
  vault?: GoalVault;
  progressPercent: number;
  projection?: GoalProjection;
  icon?: string;
  color?: string;
}

export interface GoalRequest {
  name: string;
  description?: string;
  targetAmount: number;
  targetDate?: string; // ISO date
  monthlyContribution?: number;
  yieldRatePercent?: number;
  icon?: string;
  color?: string;
  accountId: string;
}

export interface PageResponseGoal {
  content: GoalResponse[];
  totalPages: number;
}
