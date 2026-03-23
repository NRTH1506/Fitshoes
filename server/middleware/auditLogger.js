

const Logger = require('../Logger');
const auditLogger = new Logger('audit.log');

function logAdminAction(action, adminId, adminEmail, resourceType, resourceId, details = {}) {
  auditLogger.info(`Admin ${action}`, {
    action,
    adminId,
    adminEmail,
    resourceType,
    resourceId,
    details,
    timestamp: new Date().toISOString()
  });
}

function logProductAdd(adminId, adminEmail, productId, productData) {
  logAdminAction('ADD_PRODUCT', adminId, adminEmail, 'Product', productId, {
    title: productData.title_vi || productData.title,
    price: productData.price,
    currency: productData.currency
  });
}

function logProductUpdate(adminId, adminEmail, productId, productData) {
  logAdminAction('UPDATE_PRODUCT', adminId, adminEmail, 'Product', productId, {
    title: productData.title_vi || productData.title,
    price: productData.price
  });
}

function logProductDelete(adminId, adminEmail, productId, productTitle) {
  logAdminAction('DELETE_PRODUCT', adminId, adminEmail, 'Product', productId, {
    title: productTitle
  });
}

module.exports = {
  logAdminAction,
  logProductAdd,
  logProductUpdate,
  logProductDelete
};
