type Permission = {
  module: string;
  actions: string[];
};

export function hasModulePermission(
  permissions: Permission[],
  module: string,
): boolean {
  return permissions.some((perm) => {
    // 🔥 Super admin
    if (perm.module === '*' && perm.actions.includes('*')) {
      return true;
    }

    // 🔥 Global module access
    if (perm.module === '*') {
      return true;
    }

    // 🔥 Specific module with any permission
    if (perm.module === module && perm.actions.length > 0) {
      return true;
    }

    return false;
  });
}
