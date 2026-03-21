module.exports = ({
    Product,
    buildProductPayload,
    loadStaticProducts,
    isValidObjectId,
    logProductAdd,
    logProductUpdate,
    logProductDelete,
    dbConnectedRef,
    baseDir
}) => ({
    addProduct: async (req, res) => {
        try {
            if (!dbConnectedRef()) return res.status(503).json({ success: false, message: 'Database unavailable' });
            const { payload, error } = buildProductPayload(req.body);
            const { title, title_vi, price, oldPrice, currency, brand, description_vi, images, gender } = req.body || {};

            if (error) {
                return res.status(400).json({ success: false, message: error });
            }

            if (!payload && (!title_vi || !price)) {
                return res.status(400).json({ success: false, message: 'ThiÃ¡ÂºÂ¿u thÃƒÂ´ng tin sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m' });
            }

            const product = new Product(payload || {
                title: title ? String(title).trim() : String(title_vi).trim(),
                title_vi: String(title_vi).trim(),
                price: Number(price),
                oldPrice: oldPrice ? Number(oldPrice) : undefined,
                currency: String(currency || 'VND'),
                brand: String(brand || '').trim(),
                description_vi: String(description_vi || ''),
                images: Array.isArray(images) ? images.map(String) : (images ? [String(images)] : []),
                gender: ['male', 'female', 'unisex'].includes(gender) ? gender : 'unisex'
            });

            await product.save();
            logProductAdd(req.user?.id || 'unknown', req.user?.email || 'unknown', String(product._id), {
                title_vi: product.title_vi,
                price: product.price,
                currency: product.currency
            });
            return res.status(201).json({ success: true, message: 'ThÃƒÂªm sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m thÃƒÂ nh cÃƒÂ´ng', product });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'LÃ¡Â»â€”i server' });
        }
    },

    getProducts: async (req, res) => {
        try {
            const products = await Product.find().sort({ createdAt: -1 });
            if (products && products.length) return res.json({ success: true, data: products });

            const staticProducts = loadStaticProducts(baseDir);
            return res.json({ success: true, data: staticProducts });
        } catch (err) {
            console.error(err);
            const staticProducts = loadStaticProducts(baseDir);
            return res.json({ success: true, data: staticProducts });
        }
    },

    getProductById: async (req, res) => {
        try {
            try {
                const product = await Product.findById(req.params.id);
                if (product) return res.json({ success: true, data: product });
            } catch (e) { }

            const idInt = parseInt(req.params.id, 10);
            if (!isNaN(idInt)) {
                const staticProducts = loadStaticProducts(baseDir);
                const p = staticProducts.find(x => Number(x.id) === idInt);
                if (p) return res.json({ success: true, data: p });
            }

            return res.status(404).json({ success: false, message: 'KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'LÃ¡Â»â€”i server' });
        }
    },

    updateProduct: async (req, res) => {
        try {
            if (!dbConnectedRef()) return res.status(503).json({ success: false, message: 'Database unavailable' });

            if (!isValidObjectId(req.params.id)) {
                return res.status(400).json({ success: false, message: 'Id sÃƒÂ¡Ã‚ÂºÃ‚Â£n phÃƒÂ¡Ã‚ÂºÃ‚Â©m khÃƒÆ’Ã‚Â´ng hÃƒÂ¡Ã‚Â»Ã‚Â£p lÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡' });
            }

            const { payload, error } = buildProductPayload(req.body);
            const { title, title_vi, price, oldPrice, currency, description_vi, images, gender } = req.body || {};

            if (error) {
                return res.status(400).json({ success: false, message: error });
            }

            if (!payload && (!title || !title_vi || !price)) {
                return res.status(400).json({ success: false, message: 'ThiÃ¡ÂºÂ¿u thÃƒÂ´ng tin sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m' });
            }

            try {
                const product = await Product.findByIdAndUpdate(
                    req.params.id,
                    payload || {
                        title: String(title).trim(),
                        title_vi: String(title_vi).trim(),
                        price: Number(price),
                        oldPrice: oldPrice ? Number(oldPrice) : undefined,
                        currency: String(currency || 'VND'),
                        description_vi: String(description_vi || ''),
                        images: Array.isArray(images) ? images.map(String) : (images ? [String(images)] : []),
                        gender: ['male', 'female', 'unisex'].includes(gender) ? gender : 'unisex'
                    },
                    { new: true, runValidators: true }
                );

                if (product) {
                    logProductUpdate(req.user?.id || 'unknown', req.user?.email || 'unknown', req.params.id, product);
                    return res.json({ success: true, message: 'CÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m thÃƒÂ nh cÃƒÂ´ng', product });
                }
            } catch (e) { }

            return res.status(404).json({ success: false, message: 'SÃ¡ÂºÂ£n phÃ¡ÂºÂ©m khÃƒÂ´ng tÃ¡Â»â€œn tÃ¡ÂºÂ¡i' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'LÃ¡Â»â€”i server' });
        }
    },

    deleteProduct: async (req, res) => {
        try {
            if (!dbConnectedRef()) return res.status(503).json({ success: false, message: 'Database unavailable' });
            if (!isValidObjectId(req.params.id)) {
                return res.status(400).json({ success: false, message: 'Id sÃƒÂ¡Ã‚ÂºÃ‚Â£n phÃƒÂ¡Ã‚ÂºÃ‚Â©m khÃƒÆ’Ã‚Â´ng hÃƒÂ¡Ã‚Â»Ã‚Â£p lÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡' });
            }

            try {
                const product = await Product.findByIdAndDelete(req.params.id);
                if (product) {
                    logProductDelete(req.user?.id || 'unknown', req.user?.email || 'unknown', req.params.id, product.title_vi || product.title);
                    return res.json({ success: true, message: 'XÃƒÂ³a sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m thÃƒÂ nh cÃƒÂ´ng', product });
                }
            } catch (e) { }

            return res.status(404).json({ success: false, message: 'SÃ¡ÂºÂ£n phÃ¡ÂºÂ©m khÃƒÂ´ng tÃ¡Â»â€œn tÃ¡ÂºÂ¡i' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'LÃ¡Â»â€”i server' });
        }
    }
});
