module.exports = ({
    User,
    sanitizeUser,
    isValidObjectId,
    upload,
    multer,
    dbConnectedRef
}) => ({
    getUserById: async (req, res) => {
        try {
            if (!dbConnectedRef()) return res.status(503).json({ success: false, message: 'Database unavailable' });
            if (!isValidObjectId(req.params.id)) {
                return res.status(400).json({ success: false, message: 'Id không hợp lệ' });
            }
            try {
                const user = await User.findById(req.params.id).select('name email');
                if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
                return res.json({ success: true, data: { id: user._id, name: user.name, email: user.email } });
            } catch (e) {
                return res.status(400).json({ success: false, message: 'Id không hợp lệ' });
            }
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    },

    updateProfile: async (req, res) => {
        try {
            if (!dbConnectedRef()) return res.status(503).json({ success: false, message: 'Database unavailable' });

            const { phone, gender, address, bio, name } = req.body || {};
            const userId = req.user.id;
            if (!isValidObjectId(userId)) return res.status(400).json({ success: false, message: 'User ID invalid' });

            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });

            if (name !== undefined) user.name = String(name).trim();
            if (phone !== undefined) user.phone = String(phone || '').trim();
            if (gender !== undefined) {
                const cleanGender = String(gender || '').trim();
                if (!['', 'male', 'female', 'other'].includes(cleanGender)) {
                    return res.status(400).json({ success: false, message: 'Gender không hợp lệ' });
                }
                user.gender = cleanGender;
            }
            if (address !== undefined) user.address = String(address || '').trim();
            if (bio !== undefined) user.bio = String(bio || '').trim();

            await user.save();

            return res.json({
                success: true,
                message: 'Profile updated successfully',
                user: sanitizeUser(user)
            });
        } catch (err) {
            console.error('Error updating profile:', err);
            return res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    },

    uploadAvatar: (req, res) => {
        upload.single('avatar')(req, res, async (err) => {
            if (err instanceof multer.MulterError) {
                console.error('[Upload] Multer Error:', err.code, err.field);
                return res.status(400).json({ success: false, message: `Lỗi upload: ${err.message} (Field: ${err.field})` });
            } else if (err) {
                console.error('[Upload] Custom Error:', err.message);
                return res.status(400).json({ success: false, message: err.message });
            }

            try {
                const userId = req.user.id;
                console.log(`[Upload] Attempting avatar upload for user: ${userId}`);

                if (!userId) {
                    console.warn('[Upload] User ID missing in request body');
                    return res.status(400).json({ success: false, message: 'User ID required' });
                }
                if (!isValidObjectId(userId)) {
                    return res.status(400).json({ success: false, message: 'User ID invalid' });
                }

                if (!req.file) {
                    console.warn('[Upload] No file found in req.file. Body keys:', Object.keys(req.body));
                    return res.status(400).json({ success: false, message: 'No file uploaded' });
                }

                console.log(`[Upload] File received: ${req.file.filename}, size: ${req.file.size}`);

                const user = await User.findById(userId);
                if (!user) {
                    console.error(`[Upload] User not found in DB: ${userId}`);
                    return res.status(404).json({ success: false, message: 'User not found' });
                }

                const avatarUrl = `/uploads/${req.file.filename}`;
                user.avatar = avatarUrl;
                await user.save();

                console.log(`[Upload] Success! Avatar URL: ${avatarUrl}`);
                res.json({ success: true, avatarUrl, user: sanitizeUser(user) });
            } catch (err) {
                console.error('[Upload] Server Error:', err);
                res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
            }
        });
    }
});
