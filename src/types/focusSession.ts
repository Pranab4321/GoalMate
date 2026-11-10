
export type FocusSessionType =
  | "focus"
  | "short_break"
  | "long_break";

export type FocusSessionStatus =
  | "completed"
  | "interrupted"
  | "cancelled";

export interface FocusSession {
  id: string;
  task_id: string | null;
  start_time: string;
  end_time: string | null;
  duration: number;
  session_type: FocusSessionType;
  status: FocusSessionStatus;
  created_at: string;
}

export interface CreateFocusSessionInput {
  task_id?: string | null;
  start_time: string;
  end_time?: string | null;
  duration?: number;
  session_type?: FocusSessionType;
  status?: FocusSessionStatus;
}

export interface UpdateFocusSessionInput {
  task_id?: string | null;
  end_time?: string | null;
  duration?: number;
  session_type?: FocusSessionType;
  status?: FocusSessionStatus;
}
