const createAdminController = require('../controllers/admin.controller');

module.exports = ({
    fs,
    path,
    baseDir,
    User,
    Order,
    Product,
    authenticateJWT,
    requireAdminAccess,
    requireAdminRole,
    upload
}) => {
    const router = require("express").Router();
    const controller = createAdminController({
        fs,
        path,
        baseDir,
        User,
        Order,
        Product
    });

    // Logs
    router.get('/logs', authenticateJWT, requireAdminAccess, controller.getLogs);

    // User management
    router.get('/admin/users', authenticateJWT, requireAdminAccess, controller.listUsers);
    router.get('/admin/users/:id', authenticateJWT, requireAdminAccess, controller.getUserById);
    router.put('/admin/users/:id/grant', authenticateJWT, requireAdminRole, controller.grantAccess);
    router.put('/admin/users/:id/revoke', authenticateJWT, requireAdminRole, controller.revokeAccess);
    router.delete('/admin/users/:id', authenticateJWT, requireAdminRole, controller.deleteUser);
    router.put('/admin/transfer-ownership', authenticateJWT, requireAdminRole, controller.transferOwnership);

    // Order management
    router.get('/admin/orders', authenticateJWT, requireAdminAccess, controller.listOrders);
    router.get('/admin/revenue', authenticateJWT, requireAdminAccess, controller.getRevenue);
    router.put('/admin/orders/:id/status', authenticateJWT, requireAdminRole, controller.updateOrderStatus);

    // Sale management
    router.put('/admin/products/sale', authenticateJWT, requireAdminRole, controller.setSale);

    // Product image upload
    router.post('/admin/products/upload-image', authenticateJWT, requireAdminRole, upload.single('image'), (req, res) => {
        if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ success: true, imageUrl });
    });
    // Admin activity audit logs
    router.get('/admin/activity-logs', authenticateJWT, requireAdminAccess, controller.getAdminLogs);

    return router;
};
