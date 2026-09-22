export type RoleCode =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MANAGER'
  | 'HR'
  | 'PROGRAM_ADVISOR';

export const getRoleCode = (roleId?: number): RoleCode => {
  switch (roleId) {
    case 1:
      return 'SUPER_ADMIN';
    case 2:
      return 'PROGRAM_ADVISOR';
    case 3:
      return 'MANAGER';
    case 4:
      return 'HR';
    default:
      return 'PROGRAM_ADVISOR';
  }
};

export const getRoleLabel = (roleId?: number): string => {
  switch (roleId) {
    case 1:
      return 'Super Admin';
    case 2:
      return 'Program Advisor';
    case 3:
      return 'Manager';
    case 4:
      return 'HR';
    default:
      return 'Program Advisor';
  }
};
