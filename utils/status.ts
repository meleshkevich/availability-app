// src/utils/status.ts
export type Status = 'none' | 'tentative' | 'confirmed' | 'cxl_requested' | 'cxl';

export function statusLabel(s: Status | undefined): string {
  const map: Record<Status, string> = {
    none: 'Not Selected',
    tentative: 'Tentative',
    confirmed: 'Confirmed',
    cxl_requested: 'CXL Requested',
    cxl: 'Cancelled',
  };
  return map[(s ?? 'none') as Status];
}

export function statusType(s: Status | undefined): 'primary' | 'info' | 'success' | 'warning' | 'danger' {
  const map: Partial<Record<Status, 'primary' | 'info' | 'success' | 'warning' | 'danger'>> = {
    tentative: 'info',
    confirmed: 'success',
    cxl_requested: 'warning',
    cxl: 'danger',
    none: 'primary'
  };
  return map[(s ?? 'none') as Status] ?? 'primary';
}