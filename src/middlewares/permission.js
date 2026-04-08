const ApiError = require("../shared/errors/apiError");

/**
 * RBAC/PBAC Middleware
 * @param {...string} required - can be roles (e.g. 'admin') or permissions (e.g. 'delete_user')
 */
const authorize = (...required) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    const userRoles = req.user.roles || [];
    const userPermissions = req.user.permissions || [];

    // Check if any of the required attributes match the user's roles or permissions
    const hasPermission = required.some(
      (reqAttr) =>
        userRoles.includes(reqAttr) || userPermissions.includes(reqAttr),
    );

    if (!hasPermission) {
      return next(
        new ApiError(403, "You do not have permission to perform this action"),
      );
    }

    next();
  };
};

module.exports = authorize;
