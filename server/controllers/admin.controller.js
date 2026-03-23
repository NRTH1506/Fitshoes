module.exports = ({
    fs,
    path,
    baseDir,
    User,
    Order
}) => ({
    // ─── Logs ─────────────────────────────────────────────
    getLogs: (req, res) => {
        try {
            const typeAliases = {
                http: 'http-requests.log',
                auth: 'authentication.log',
                audit: 'audit.log',
                error: 'errors.log'
            };
            const requestedType = String(req.query.type || '').trim();
            const search = String(req.query.search || '').trim().toLowerCase();
            const page = Math.max(1, parseInt(req.query.page, 10) || 1);
            const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));

            let targetFiles;
            if (!requestedType) {
                targetFiles = Object.values(typeAliases);
            } else if (typeAliases[requestedType]) {
                targetFiles = [typeAliases[requestedType]];
            } else if (requestedType === path.basename(requestedType) && !requestedType.includes('..')) {
                targetFiles = [requestedType];
            } else {
                return res.status(400).json({ success: false, message: 'Invalid log type' });
            }

            const logs = [];

            for (const filename of targetFiles) {
                const logPath = path.join(baseDir, 'logs', filename);
                if (!fs.existsSync(logPath)) continue;

                const content = fs.readFileSync(logPath, 'utf-8');
                const entries = content.split('\n')
                    .filter(line => line.trim())
                    .map(line => {
                        try {
                            return JSON.parse(line);
                        } catch (e) {
                            return null;
                        }
                    })
                    .filter(Boolean)
                    .map(entry => ({
                        ...entry,
                        type: entry.type || filename.replace(/\.log$/i, '')
                    }));

                logs.push(...entries);
            }

            const filteredLogs = search
                ? logs.filter((entry) => JSON.stringify(entry).toLowerCase().includes(search))
                : logs;

            filteredLogs.sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')));

            const total = filteredLogs.length;
            const start = (page - 1) * limit;
            const pagedLogs = filteredLogs.slice(start, start + limit);

            res.json({ success: true, logs: pagedLogs, total, page, limit });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Error reading logs' });
        }
    },

    // ─── User Management ──────────────────────────────────
    listUsers: async (req, res) => {
        try {
            const users = await User.find({})
                .select('name email role canAccessAdmin authorizedBy authorizedAt createdAt')
                .sort({ createdAt: -1 })
                .lean();
            res.json({ success: true, users });
        } catch (err) {
            console.error('[Admin] listUsers error:', err);
            res.status(500).json({ success: false, message: 'Failed to list users' });
        }
    },

    grantAccess: async (req, res) => {
        try {
            const { id } = req.params;
            const user = await User.findById(id);
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });

            if (user.canAccessAdmin) {
                return res.json({ success: true, message: 'User already has admin access' });
            }

            user.canAccessAdmin = true;
            user.authorizedBy = req.user.id;
            user.authorizedAt = new Date();
            await user.save();

            res.json({ success: true, message: `Granted admin access to ${user.email}` });
        } catch (err) {
            console.error('[Admin] grantAccess error:', err);
            res.status(500).json({ success: false, message: 'Failed to grant access' });
        }
    },

    revokeAccess: async (req, res) => {
        try {
            const { id } = req.params;
            const user = await User.findById(id);
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });

            // Cannot revoke from the main admin
            if (user.role === 'admin') {
                return res.status(403).json({ success: false, message: 'Cannot revoke access from admin owner' });
            }

            user.canAccessAdmin = false;
            user.authorizedBy = null;
            user.authorizedAt = null;
            await user.save();

            res.json({ success: true, message: `Revoked admin access from ${user.email}` });
        } catch (err) {
            console.error('[Admin] revokeAccess error:', err);
            res.status(500).json({ success: false, message: 'Failed to revoke access' });
        }
    },

    transferOwnership: async (req, res) => {
        try {
            const { targetEmail } = req.body;
            if (!targetEmail) return res.status(400).json({ success: false, message: 'Target email required' });

            const currentAdmin = await User.findById(req.user.id);
            if (!currentAdmin || currentAdmin.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Only admin owner can transfer' });
            }

            const normalizedEmail = String(targetEmail).trim().toLowerCase();
            const targetUser = await User.findOne({ email: normalizedEmail });
            if (!targetUser) return res.status(404).json({ success: false, message: 'Target user not found' });
            if (String(targetUser._id) === String(currentAdmin._id)) {
                return res.status(400).json({ success: false, message: 'Cannot transfer to yourself' });
            }

            // Promote target
            targetUser.role = 'admin';
            targetUser.canAccessAdmin = true;
            targetUser.authorizedBy = currentAdmin._id;
            targetUser.authorizedAt = new Date();
            await targetUser.save();

            // Demote self
            currentAdmin.role = 'user';
            currentAdmin.canAccessAdmin = false;
            currentAdmin.authorizedBy = null;
            currentAdmin.authorizedAt = null;
            await currentAdmin.save();

            res.json({ success: true, message: `Ownership transferred to ${targetUser.email}` });
        } catch (err) {
            console.error('[Admin] transferOwnership error:', err);
            res.status(500).json({ success: false, message: 'Failed to transfer ownership' });
        }
    },

    // ─── Order Management ─────────────────────────────────
    listOrders: async (req, res) => {
        try {
            const { status, search, startDate, endDate, page: p, limit: l } = req.query;
            const page = Math.max(1, parseInt(p, 10) || 1);
            const limit = Math.max(1, Math.min(100, parseInt(l, 10) || 20));

            const filter = {};

            if (status && ['PENDING', 'SUCCESS', 'FAILED'].includes(status)) {
                filter.status = status;
            }

            if (startDate || endDate) {
                filter.createdAt = {};
                if (startDate) filter.createdAt.$gte = new Date(startDate);
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    filter.createdAt.$lte = end;
                }
            }

            if (search) {
                const q = String(search).trim();
                // Try matching by app_trans_id or userId
                filter.$or = [
                    { app_trans_id: { $regex: q, $options: 'i' } },
                    { userId: { $regex: q, $options: 'i' } }
                ];
            }

            const total = await Order.countDocuments(filter);
            const orders = await Order.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();

            res.json({ success: true, orders, total, page, limit });
        } catch (err) {
            console.error('[Admin] listOrders error:', err);
            res.status(500).json({ success: false, message: 'Failed to list orders' });
        }
    },

    getRevenue: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;

            const matchStage = { status: 'SUCCESS' };
            if (startDate || endDate) {
                matchStage.createdAt = {};
                if (startDate) matchStage.createdAt.$gte = new Date(startDate);
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    matchStage.createdAt.$lte = end;
                }
            }

            const [stats] = await Order.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$amount' },
                        orderCount: { $sum: 1 },
                        avgOrderValue: { $avg: '$amount' }
                    }
                }
            ]);

            // Today's revenue
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const [todayStats] = await Order.aggregate([
                { $match: { status: 'SUCCESS', createdAt: { $gte: todayStart } } },
                {
                    $group: {
                        _id: null,
                        revenue: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Status counts
            const statusCounts = await Order.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]);

            const statusMap = {};
            statusCounts.forEach(s => { statusMap[s._id] = s.count; });

            res.json({
                success: true,
                revenue: {
                    total: stats?.totalRevenue || 0,
                    orderCount: stats?.orderCount || 0,
                    avgOrderValue: Math.round(stats?.avgOrderValue || 0),
                    todayRevenue: todayStats?.revenue || 0,
                    todayOrders: todayStats?.count || 0,
                    statusCounts: statusMap
                }
            });
        } catch (err) {
            console.error('[Admin] getRevenue error:', err);
            res.status(500).json({ success: false, message: 'Failed to get revenue' });
        }
    },

    updateOrderStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!['PENDING', 'SUCCESS', 'FAILED'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Invalid status' });
            }

            const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
            if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

            res.json({ success: true, order });
        } catch (err) {
            console.error('[Admin] updateOrderStatus error:', err);
            res.status(500).json({ success: false, message: 'Failed to update order' });
        }
    }
});
