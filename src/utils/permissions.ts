type Permission = {
  module: string;
  actions: string[];
};

export function hasPermission(
  permissions: Permission[],
  module: string,
  action: string,
): boolean {
  return permissions.some((perm) => {
    // 🔥 Super admin
    if (perm.module === '*' && perm.actions.includes('*')) {
      return true;
    }
    

    // 🔥 Module wildcard
    if (perm.module === '*' && perm.actions.includes(action)) {
      return true;
    }

    // 🔥 Module match
    if (perm.module === module) {
      // Action wildcard
      if (perm.actions.includes('*')) {
        return true;
      }

      // Exact action
      if (perm.actions.includes(action)) {
        return true;
      }
    }

    return false;
  });
}


/**
 * Employee onboarding (links, review, approve) is limited to Admin and roles
 * granted `user:onboarding` (e.g. HR). Mirrors UserLogic.hasFullUserAccess.
 */
export function canManageOnboarding(): boolean {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?.role?.name === 'Admin' || user?.role?.isSuperAdmin) return true;
    const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');
    return hasPermission(permissions, 'user', 'onboarding');
  } catch {
    return false;
  }
}
