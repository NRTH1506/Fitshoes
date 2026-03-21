const createOrderController = require('../controllers/order.controller');

module.exports = ({
    Order,
    User,
    authenticateJWT,
    axios,
    crypto,
    moment,
    mongoose,
    ZALOPAY,
    GMAIL_REFRESH_TOKEN,
    GMAIL_USER,
    mailTransporter,
    sendEmailViaGmailAPI
}) => {
    const router = require("express").Router();
    const controller = createOrderController({
        Order,
        User,
        axios,
        crypto,
        moment,
        mongoose,
        ZALOPAY,
        GMAIL_REFRESH_TOKEN,
        GMAIL_USER,
        mailTransporter,
        sendEmailViaGmailAPI
    });

    router.get('/ping', controller.ping);
    router.get('/pay/zalopay/query/:app_trans_id', controller.queryZaloPay);
    router.get('/orders/user/:userId', authenticateJWT, controller.getUserOrders);
    router.post('/pay/zalopay', controller.createOrder);
    router.post('/zalopay/callback', controller.zaloPayCallback);

    return router;
};
