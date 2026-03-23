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
            return res.status(500).json({ success: false, message: "Lỗi truy vấn đơn hàng" });
        }
    },

    getUserOrders: async (req, res) => {
        try {
            const { userId } = req.params;
            if (!userId) {
                return res.status(400).json({ success: false, message: "Thiếu userId" });
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
            return res.status(500).json({ success: false, message: "Lỗi lấy lịch sử đơn hàng" });
        }
    },

    createOrder: async (req, res) => {
        try {
            const { amount, items, userId } = req.body;

            if (!Number.isFinite(Number(amount)) || Number(amount) <= 0 || !Array.isArray(items) || items.length === 0) {
                return res.json({ success: false, message: "Thiếu dữ liệu đơn hàng" });
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
                description: `Thanh toán đơn hàng #${app_trans_id}`,
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

            console.log(`[ZaloPay] Tạo đơn hàng ${app_trans_id}...`);

            const formBody = new URLSearchParams(orderData).toString();
            const zalores = await axios.post(ZALOPAY.endpoint, formBody, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            console.log("[ZaloPay] Response:", zalores.data);

            const returnCode = zalores.data.return_code !== undefined ? zalores.data.return_code : zalores.data.returncode;
            if (returnCode !== 1) {
                return res.json({
                    success: false,
                    message: "ZaloPay từ chối: " + (zalores.data.return_message || "Lỗi"),
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
            console.error("[ZaloPay] Lỗi tạo đơn:", err.message);
            return res.json({ success: false, message: "Lỗi kết nối cổng thanh toán." });
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

                console.log(`[ZaloPay Callback] Nhận tín hiệu từ ZaloPay: ${app_trans_id}`);

                const order = await Order.findOneAndUpdate(
                    { app_trans_id: app_trans_id },
                    { status: "SUCCESS" },
                    { new: true }
                );

                if (order) {
                    console.log(`[DB] Đã update đơn hàng ${app_trans_id} thành SUCCESS`);

                    let userEmail = "email_admin@example.com";
                    if (order.userId && mongoose.Types.ObjectId.isValid(order.userId)) {
                        const user = await User.findById(order.userId).select('email');
                        if (user && user.email) userEmail = user.email;
                    }

                    if (userEmail && mailTransporter) {
                        const mailOptions = {
                            from: GMAIL_USER,
                            to: userEmail,
                            subject: `[FitShoes] Thanh toán thành công #${app_trans_id}`,
                            html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
                                <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">FITSHOES</h1>
                                </div>
                                <div style="padding: 30px; background-color: #ffffff;">
                                    <h2 style="color: #333333; margin-top: 0;">Cảm ơn bạn đã mua hàng! </h2>
                                    <p style="color: #555555; line-height: 1.6; font-size: 16px;">
                                        Thanh toán của bạn qua ZaloPay đã được xác nhận. Chúng tôi đang chuẩn bị đơn hàng và sẽ giao đến bạn trong thời gian sớm nhất.
                                    </p>
                                    
                                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #f3f4f6;">
                                        <table style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding-bottom: 10px; color: #6b7280;">Mã đơn:</td>
                                                <td style="padding-bottom: 10px; text-align: right; font-weight: bold; color: #111827;">${app_trans_id}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding-bottom: 10px; color: #6b7280;">Số tiền:</td>
                                                <td style="padding-bottom: 10px; text-align: right; font-weight: bold; color: #111827; font-size: 18px;">${new Intl.NumberFormat('vi-VN').format(amount)} ₫</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #6b7280;">Trạng thái:</td>
                                                <td style="text-align: right;"><span style="background-color: #def7ec; color: #03543f; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 14px;">THÀNH CÔNG</span></td>
                                            </tr>
                                        </table>
                                    </div>

                                    <div style="text-align: center; margin-top: 30px;">
                                        <a href="${process.env.FE_ORIGINS?.split(',')[0] || 'http://localhost:5173'}/profile" style="background-color: #1a1a1a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">Theo Dõi Đơn Hàng</a>
                                    </div>
                                </div>
                                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; color: #9ca3af; font-size: 13px;">
                                    <p style="margin: 0;">© ${new Date().getFullYear()} FitShoes Store. All rights reserved.</p>
                                </div>
                            </div>
                            `
                        };

                        mailTransporter.sendMail(mailOptions, (err, info) => {
                            if (err) console.error("[Mail Error]", err.message || err);
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
