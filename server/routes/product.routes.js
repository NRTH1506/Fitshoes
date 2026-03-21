const createProductController = require('../controllers/product.controller');

module.exports = ({
    Product,
    authenticateJWT,
    requireAdminAccess,
    buildProductPayload,
    loadStaticProducts,
    isValidObjectId,
    logProductAdd,
    logProductUpdate,
    logProductDelete,
    dbConnectedRef,
    baseDir
}) => {
    const router = require("express").Router();
    const controller = createProductController({
        Product,
        buildProductPayload,
        loadStaticProducts,
        isValidObjectId,
        logProductAdd,
        logProductUpdate,
        logProductDelete,
        dbConnectedRef,
        baseDir
    });

    router.post('/products/add', authenticateJWT, requireAdminAccess, controller.addProduct);
    router.get('/products', controller.getProducts);
    router.get('/products/:id', controller.getProductById);
    router.put('/products/:id', authenticateJWT, requireAdminAccess, controller.updateProduct);
    router.delete('/products/:id', authenticateJWT, requireAdminAccess, controller.deleteProduct);

    return router;
};
