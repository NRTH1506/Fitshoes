const createAdminController = require('../controllers/admin.controller');

module.exports = ({
    fs,
    path,
    baseDir,
    User,
    Order,
    authenticateJWT,
    requireAdminAccess,
    requireAdminRole
}) => {
    const router = require("express").Router();
    const controller = createAdminController({
        fs,
        path,
        baseDir,
        User,
        Order
    });

    // All routes require authentication + admin access
    router.get('/logs', authenticateJWT, requireAdminAccess, controller.getLogs);

    // User management (admin role only for grant/revoke/transfer)
    router.get('/admin/users', authenticateJWT, requireAdminAccess, controller.listUsers);
    router.put('/admin/users/:id/grant', authenticateJWT, requireAdminRole, controller.grantAccess);
    router.put('/admin/users/:id/revoke', authenticateJWT, requireAdminRole, controller.revokeAccess);
    router.put('/admin/transfer-ownership', authenticateJWT, requireAdminRole, controller.transferOwnership);

    // Order management
    router.get('/admin/orders', authenticateJWT, requireAdminAccess, controller.listOrders);
    router.get('/admin/revenue', authenticateJWT, requireAdminAccess, controller.getRevenue);
    router.put('/admin/orders/:id/status', authenticateJWT, requireAdminRole, controller.updateOrderStatus);

    return router;
};
