const createAdminController = require('../controllers/admin.controller');

module.exports = ({
    fs,
    path,
    baseDir,
    authenticateJWT,
    requireAdminAccess
}) => {
    const router = require("express").Router();
    const controller = createAdminController({
        fs,
        path,
        baseDir
    });

    router.get('/logs', authenticateJWT, requireAdminAccess, controller.getLogs);

    return router;
};
