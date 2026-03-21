module.exports = ({
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
}) => ({
    ping: (req, res) => res.json({ success: true, message: "pong", timestamp: new Date() }),

    queryZaloPay: async (req, res) => {
        try {
            const { app_trans_id } = req.params;
            const postData = { app_id: ZALOPAY.app_id, app_trans_id };
            const dataToSign = `${postData.app_id}|${postData.app_trans_id}|${ZALOPAY.key1}`;
            postData.mac = crypto.createHmac("sha256", ZALOPAY.key1).update(dataToSign).digest("hex");
            const queryEndpoint = ZALOPAY.endpoint.replace("/create", "/query");
            const queryRes = await axios.post(queryEndpoint, new URLSearchParams(postData).toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });
            let status = "PENDING";
            if (queryRes.data.return_code === 1) status = "SUCCESS";
            else if (queryRes.data.return_code === 2) status = "FAILED";
            if (status !== "PENDING") await Order.findOneAndUpdate({ app_trans_id }, { status });
            return res.json({ success: true, status, detail: queryRes.data });
        } catch (err) {
            return res.status(500).json({ success: false, message: "LÃ¡Â»â€”i truy vÃ¡ÂºÂ¥n Ã„â€˜Ã†Â¡n hÃƒÂ ng" });
        }
    },

    getUserOrders: async (req, res) => {
        try {
            const { userId } = req.params;
            if (!userId) {
                return res.status(400).json({ success: false, message: "ThiÃƒÂ¡Ã‚ÂºÃ‚Â¿u userId" });
            }
            const canViewOrders = String(req.user.id) === String(userId)
                || req.user.role === 'admin'
                || !!req.user.canAccessAdmin;
            if (!canViewOrders) {
                return res.status(403).json({ success: false, message: 'Forbidden' });
            }
            const orders = await Order.find({ userId }).sort({ createdAt: -1 });
            return res.json({ success: true, orders });
        } catch (err) {
            return res.status(500).json({ success: false, message: "LÃ¡Â»â€”i lÃ¡ÂºÂ¥y lÃ¡Â»â€¹ch sÃ¡Â»Â­ Ã„â€˜Ã†Â¡n hÃƒÂ ng" });
        }
    },

    createOrder: async (req, res) => {
        try {
            const { amount, items, userId } = req.body;

            if (!Number.isFinite(Number(amount)) || Number(amount) <= 0 || !Array.isArray(items) || items.length === 0) {
                return res.json({ success: false, message: "Thiáº¿u dá»¯ liá»‡u Ä‘Æ¡n hÃ ng" });
            }

            const app_trans_id = `${moment().format("YYMMDD")}_${Date.now()}`;
            const origin = req.headers.origin || process.env.FE_URL || "http://localhost:5173";
            const embed_data = {
                redirecturl: `${origin}/payment-success`
            };

            const protocol = req.headers['x-forwarded-proto'] || req.protocol;
            const host = req.get('host');
            const callback_url = process.env.ZALOPAY_CALLBACK_URL || `${protocol}://${host}/api/zalopay/callback`;

            const orderData = {
                app_id: ZALOPAY.app_id,
                app_user: userId || "guest",
                app_trans_id,
                app_time: Date.now(),
                item: JSON.stringify(items),
                amount: Number(amount),
                description: `Thanh toÃ¡n Ä‘Æ¡n hÃ ng #${app_trans_id}`,
                bank_code: "zalopayapp",
                embed_data: JSON.stringify(embed_data),
                callback_url: callback_url
            };

            const dataToSign = [
                orderData.app_id,
                orderData.app_trans_id,
                orderData.app_user,
                orderData.amount,
                orderData.app_time,
                orderData.embed_data,
                orderData.item
            ].join("|");

            orderData.mac = crypto.createHmac("sha256", ZALOPAY.key1).update(dataToSign).digest("hex");

            console.log(`[ZaloPay] Táº¡o Ä‘Æ¡n hÃ ng ${app_trans_id}...`);

            const formBody = new URLSearchParams(orderData).toString();
            const zalores = await axios.post(ZALOPAY.endpoint, formBody, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            console.log("[ZaloPay] Response:", zalores.data);

            const returnCode = zalores.data.return_code !== undefined ? zalores.data.return_code : zalores.data.returncode;
            if (returnCode !== 1) {
                return res.json({
                    success: false,
                    message: "ZaloPay tá»« chá»‘i: " + (zalores.data.return_message || "Lá»—i"),
                    detail: zalores.data
                });
            }

            await Order.create({
                userId,
                items,
                amount: Number(amount),
                paymentMethod: "ZALOPAY",
                app_trans_id,
                status: "PENDING"
            });

            return res.json({
                success: true,
                payUrl: zalores.data.order_url,
                app_trans_id
            });

        } catch (err) {
            console.error("[ZaloPay] Lá»—i táº¡o Ä‘Æ¡n:", err.message);
            return res.json({ success: false, message: "Lá»—i káº¿t ná»‘i cá»•ng thanh toÃ¡n." });
        }
    },

    zaloPayCallback: async (req, res) => {
        let result = {};

        try {
            const { data: dataStr, mac: reqMac } = req.body;
            if (!dataStr || !reqMac) {
                return res.status(400).json({ return_code: -1, return_message: "missing callback payload" });
            }
            const mac = crypto.createHmac("sha256", ZALOPAY.key2).update(dataStr).digest("hex");

            if (reqMac !== mac) {
                result.return_code = -1;
                result.return_message = "mac not equal";
            } else {
                const dataJson = JSON.parse(dataStr);
                const { app_trans_id, amount } = dataJson;

                console.log(`[ZaloPay Callback] Nháº­n tÃ­n hiá»‡u tá»« ZaloPay: ${app_trans_id}`);

                const order = await Order.findOneAndUpdate(
                    { app_trans_id: app_trans_id },
                    { status: "SUCCESS" },
                    { new: true }
                );

                if (order) {
                    console.log(`[DB] ÄÃ£ update Ä‘Æ¡n hÃ ng ${app_trans_id} thÃ nh SUCCESS`);

                    let userEmail = '';
                    if (order.userId && mongoose.Types.ObjectId.isValid(order.userId)) {
                        const user = await User.findById(order.userId).select('email');
                        if (user) userEmail = user.email;
                    }
                    if (userEmail && GMAIL_REFRESH_TOKEN) {
                        sendEmailViaGmailAPI({
                            to: userEmail,
                            subject: `[FitShoes] Thanh toÃƒÂ¡n thÃƒÂ nh cÃƒÂ´ng #${app_trans_id}`,
                            text: [
                                'Cam on ban da mua hang tai FitShoes.',
                                `Ma don: ${app_trans_id}`,
                                `So tien: ${new Intl.NumberFormat('vi-VN').format(amount)} VND`,
                                'Trang thai: THANH CONG'
                            ].join('\n')
                        });
                    }
                    if (false) {
                        let userEmail = "email_admin@example.com";

                        if (order.userId && mongoose.Types.ObjectId.isValid(order.userId)) {
                            const user = await User.findById(order.userId);
                            if (user) userEmail = user.email;
                        }

                        const mailOptions = {
                            from: GMAIL_USER,
                            to: userEmail,
                            subject: `[FitShoes] Thanh toÃ¡n thÃ nh cÃ´ng #${app_trans_id}`,
                            html: `
                            <h2>Cáº£m Æ¡n báº¡n Ä‘Ã£ mua hÃ ng!</h2>
                            <p>MÃ£ Ä‘Æ¡n: <b>${app_trans_id}</b></p>
                            <p>Sá»‘ tiá»n: <b>${new Intl.NumberFormat('vi-VN').format(amount)} Ä‘</b></p>
                            <p>Tráº¡ng thÃ¡i: <span style="color:green">THÃ€NH CÃ”NG</span></p>
                        `
                        };

                        mailTransporter.sendMail(mailOptions, (err, info) => {
                            if (err) console.error("[Mail Error]", err);
                            else console.log("[Mail Sent]", info.response);
                        });
                    }

                    result.return_code = 1;
                    result.return_message = "success";
                } else {
                    result.return_code = 0;
                    result.return_message = "order not found";
                }
            }
        } catch (ex) {
            console.error("[Callback Error]", ex.message);
            result.return_code = 0;
            result.return_message = ex.message;
        }

        res.json(result);
    }
});
