const createUserController = require('../controllers/user.controller');

module.exports = ({
    User,
    authenticateJWT,
    sanitizeUser,
    isValidObjectId,
    upload,
    multer,
    dbConnectedRef
}) => {
    const router = require("express").Router();
    const controller = createUserController({
        User,
        sanitizeUser,
        isValidObjectId,
        upload,
        multer,
        dbConnectedRef
    });

    router.get('/users/:id', controller.getUserById);
    router.put('/profile', authenticateJWT, controller.updateProfile);
    router.post('/profile/upload', authenticateJWT, controller.uploadAvatar);

    return router;
};
