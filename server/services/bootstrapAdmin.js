const User = require('../models/User');

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

async function ensureAdminUser(hasher) {
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || 'admin@fitshoes.local');
  const adminPassword = String(process.env.ADMIN_PASSWORD || 'Admin@123456');
  const adminName = String(process.env.ADMIN_NAME || 'FitShoes Admin').trim();

  if (!adminEmail) {
    console.warn('[bootstrapAdmin] ADMIN_EMAIL missing, skipping admin bootstrap');
    return;
  }

  let user = await User.findOne({ email: adminEmail });

  if (!user) {
    const passwordHash = await hasher.hashPassword(adminPassword);
    user = await User.create({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'admin',
      canAccessAdmin: true
    });

    console.log(`[bootstrapAdmin] Created admin user: ${user.email}`);
    return;
  }

  let changed = false;

  if (user.role !== 'admin') {
    user.role = 'admin';
    changed = true;
  }

  if (!user.canAccessAdmin) {
    user.canAccessAdmin = true;
    changed = true;
  }

  if (changed) {
    await user.save();
    console.log(`[bootstrapAdmin] Updated admin access for: ${user.email}`);
  }
}

module.exports = {
  ensureAdminUser
};
