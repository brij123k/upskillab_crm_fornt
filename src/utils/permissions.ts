type Permission = {
  module: string;
  actions: string[];
};

export function hasPermission(
  permissions: Permission[],
  module: string,
  action: string,
): boolean {
    console.log(permissions)
    console.log(module,action)
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
