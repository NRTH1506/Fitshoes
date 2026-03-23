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
            const { title, title_vi, price, currency, brand, description_vi, images, gender, category, inventory } = req.body || {};

            if (error) {
                return res.status(400).json({ success: false, message: error });
            }

            if (!payload && (!title_vi || !price)) {
                return res.status(400).json({ success: false, message: 'Thiếu thông tin sản phẩm' });
            }

            const product = new Product(payload || {
                title: title ? String(title).trim() : String(title_vi).trim(),
                title_vi: String(title_vi).trim(),
                price: Number(price),
                currency: String(currency || 'VND'),
                brand: String(brand || '').trim(),
                description_vi: String(description_vi || ''),
                images: Array.isArray(images) ? images.map(String) : (images ? [String(images)] : []),
                gender: ['male', 'female', 'unisex'].includes(gender) ? gender : 'unisex',
                category: ['running','gym','casual','sandals','boots','other'].includes(category) ? category : 'other',
                inventory: Array.isArray(inventory) ? inventory : []
            });

            await product.save();
            logProductAdd(req.user?.id || 'unknown', req.user?.email || 'unknown', String(product._id), {
                title_vi: product.title_vi,
                price: product.price,
                currency: product.currency
            });
            return res.status(201).json({ success: true, message: 'Thêm sản phẩm thành công', product });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Lỗi server' });
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

            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    },

    updateProduct: async (req, res) => {
        try {
            if (!dbConnectedRef()) return res.status(503).json({ success: false, message: 'Database unavailable' });

            if (!isValidObjectId(req.params.id)) {
                return res.status(400).json({ success: false, message: 'Id sản phẩm không hợp lệ' });
            }

            const { payload, error } = buildProductPayload(req.body);
            const { title, title_vi, price, currency, description_vi, images, gender, category, inventory, brand } = req.body || {};

            if (error) {
                return res.status(400).json({ success: false, message: error });
            }

            if (!payload && (!title || !title_vi || !price)) {
                return res.status(400).json({ success: false, message: 'Thiếu thông tin sản phẩm' });
            }

            try {
                const updateData = payload || {
                    title: String(title).trim(),
                    title_vi: String(title_vi).trim(),
                    price: Number(price),
                    currency: String(currency || 'VND'),
                    brand: brand !== undefined ? String(brand).trim() : undefined,
                    description_vi: String(description_vi || ''),
                    images: Array.isArray(images) ? images.map(String) : (images ? [String(images)] : []),
                    gender: ['male', 'female', 'unisex'].includes(gender) ? gender : 'unisex',
                    category: ['running','gym','casual','sandals','boots','other'].includes(category) ? category : undefined,
                    inventory: Array.isArray(inventory) ? inventory : undefined
                };
                // Remove undefined fields
                Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);
                const product = await Product.findByIdAndUpdate(
                    req.params.id,
                    updateData,
                    { new: true, runValidators: true }
                );

                if (product) {
                    logProductUpdate(req.user?.id || 'unknown', req.user?.email || 'unknown', req.params.id, product);
                    return res.json({ success: true, message: 'Cập nhật sản phẩm thành công', product });
                }
            } catch (e) { }

            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    },

    deleteProduct: async (req, res) => {
        try {
            if (!dbConnectedRef()) return res.status(503).json({ success: false, message: 'Database unavailable' });
            if (!isValidObjectId(req.params.id)) {
                return res.status(400).json({ success: false, message: 'Id sản phẩm không hợp lệ' });
            }

            try {
                const product = await Product.findByIdAndDelete(req.params.id);
                if (product) {
                    logProductDelete(req.user?.id || 'unknown', req.user?.email || 'unknown', req.params.id, product.title_vi || product.title);
                    return res.json({ success: true, message: 'Xóa sản phẩm thành công', product });
                }
            } catch (e) { }

            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    }
});
