export type RoleCode =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MANAGER'
  | 'HR'
  | 'PROGRAM_ADVISOR'
  | 'TEAM_LEAD';

export const getRoleCode = (
  roleId?: number | string,
  roleName?: string,
): RoleCode => {
  if (roleName) {
    const clean = roleName.toUpperCase().replace(/\s+/g, '_');
    if (clean === 'SUPER_ADMIN' || clean === 'SUPERADMIN') return 'SUPER_ADMIN';
    if (clean === 'MANAGER') return 'MANAGER';
    if (clean === 'HR') return 'HR';
    if (clean === 'TEAM_LEAD' || clean === 'TEAMLEAD' || clean.includes('LEAD')) return 'TEAM_LEAD';
    if (clean === 'PROGRAM_ADVISOR' || clean === 'ADVISOR' || clean === 'PA') return 'PROGRAM_ADVISOR';
  }

  const numericId = roleId !== undefined && roleId !== null ? Number(roleId) : undefined;
  switch (numericId) {
    case 1:
      return 'SUPER_ADMIN';
    case 2:
      return 'PROGRAM_ADVISOR';
    case 3:
      return 'MANAGER';
    case 4:
      return 'HR';
    case 5:
      return 'TEAM_LEAD';
    default:
      return 'PROGRAM_ADVISOR';
  }
};

export const getRoleLabel = (
  roleId?: number | string,
  roleName?: string,
): string => {
  if (roleName) {
    const clean = roleName.toUpperCase().replace(/\s+/g, '_');
    if (clean === 'SUPER_ADMIN' || clean === 'SUPERADMIN') return 'Super Admin';
    if (clean === 'MANAGER') return 'Manager';
    if (clean === 'HR') return 'HR';
    if (clean === 'TEAM_LEAD' || clean === 'TEAMLEAD' || clean.includes('LEAD')) return 'Team Lead';
    if (clean === 'PROGRAM_ADVISOR' || clean === 'ADVISOR' || clean === 'PA') return 'Program Advisor';
  }

  const numericId = roleId !== undefined && roleId !== null ? Number(roleId) : undefined;
  switch (numericId) {
    case 1:
      return 'Super Admin';
    case 2:
      return 'Program Advisor';
    case 3:
      return 'Manager';
    case 4:
      return 'HR';
    case 5:
      return 'Team Lead';
    default:
      return 'Program Advisor';
  }
};
