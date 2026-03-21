const { normalizeEmail } = require('../middleware/auth');

async function ensureDefaultAdminUser({ User, hasher }) {
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || 'admin@fitshoes.local');
  const adminPassword = String(process.env.ADMIN_PASSWORD || 'Admin@123456');
  const adminName = String(process.env.ADMIN_NAME || 'FitShoes Admin').trim();

  if (!adminEmail || !adminPassword) return;

  try {
    const existing = await User.findOne({ email: adminEmail });
    if (!existing) {
      const passwordHash = await hasher.hashPassword(adminPassword);
      await User.create({
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: 'admin',
        canAccessAdmin: true,
        authorizedAt: new Date()
      });
      console.log(`[Auth] Seeded admin user: ${adminEmail}`);
      return;
    }

    let shouldSave = false;
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      shouldSave = true;
    }
    if (!existing.canAccessAdmin) {
      existing.canAccessAdmin = true;
      shouldSave = true;
    }
    if (shouldSave) {
      existing.authorizedAt = existing.authorizedAt || new Date();
      await existing.save();
      console.log(`[Auth] Updated existing user as admin: ${adminEmail}`);
    }
  } catch (err) {
    console.warn('[Auth] Failed to ensure default admin user:', err && err.message);
  }
}

module.exports = { ensureDefaultAdminUser };
