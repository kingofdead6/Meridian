// Each role gets access to whole modules. "*" means everything.
export const MODULES = ['crm', 'sales', 'purchasing', 'inventory', 'accounting', 'reports', 'hr', 'projects', 'settings'];

export const ROLES = {
  admin: ['*'],
  manager: ['crm', 'sales', 'purchasing', 'inventory', 'reports', 'hr', 'projects'],
  accountant: ['accounting', 'reports', 'sales', 'purchasing'],
  sales: ['crm', 'sales', 'projects'],
  warehouse: ['inventory', 'purchasing'],
  hr: ['hr', 'projects'],
};

export function can(role, modules) {
  const granted = ROLES[role] || [];
  if (granted.includes('*')) return true;
  const wanted = Array.isArray(modules) ? modules : [modules];
  return wanted.some((m) => granted.includes(m));
}

export const permissionsFor = (role) => (ROLES[role]?.includes('*') ? MODULES : ROLES[role] || []);
