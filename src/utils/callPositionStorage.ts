/**
 * Call Workspace Persistence Utility
 * Manages:
 * 1. Assignment-level record progress (call-workspace:{userId}:{assignmentId} -> currentRecordIndex)
 * 2. Last active assignment batch (call-last-assignment:{userId} -> assignmentId)
 * 3. Per-record phone attempt/position (call-position:{userId}:{studentDataId} -> currentPhoneIndex)
 */

export const getAssignmentRecordIndex = (
  userId: string | undefined | null,
  assignmentId: string | undefined | null
): number => {
  if (!userId || !assignmentId) return 0;
  try {
    const key = `call-workspace:${userId}:${assignmentId}`;
    const val = localStorage.getItem(key);
    return val ? Math.max(0, parseInt(val, 10) || 0) : 0;
  } catch {
    return 0;
  }
};

export const setAssignmentRecordIndex = (
  userId: string | undefined | null,
  assignmentId: string | undefined | null,
  index: number
): void => {
  if (!userId || !assignmentId) return;
  try {
    const key = `call-workspace:${userId}:${assignmentId}`;
    localStorage.setItem(key, String(Math.max(0, index)));
  } catch {
    // ignore
  }
};

export const getLastActiveAssignmentId = (
  userId: string | undefined | null
): string | null => {
  if (!userId) return null;
  try {
    const key = `call-last-assignment:${userId}`;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const saveLastActiveAssignmentId = (
  userId: string | undefined | null,
  assignmentId: string | undefined | null
): void => {
  if (!userId || !assignmentId) return;
  try {
    const key = `call-last-assignment:${userId}`;
    localStorage.setItem(key, assignmentId);
  } catch {
    // ignore
  }
};

export const getRecordPhonePosition = (
  userId: string | undefined | null,
  studentDataId: string | undefined | null
): number => {
  if (!userId || !studentDataId) return 1;
  try {
    const key = `call-position:${userId}:${studentDataId}`;
    const val = localStorage.getItem(key);
    return val ? Math.max(1, parseInt(val, 10) || 1) : 1;
  } catch {
    return 1;
  }
};

export const setRecordPhonePosition = (
  userId: string | undefined | null,
  studentDataId: string | undefined | null,
  position: number
): void => {
  if (!userId || !studentDataId) return;
  try {
    const key = `call-position:${userId}:${studentDataId}`;
    localStorage.setItem(key, String(Math.max(1, position)));
  } catch {
    // ignore
  }
};
