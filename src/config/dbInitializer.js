import bcrypt from 'bcryptjs';
import { Role, Product, User } from '../models/index.js';

export async function initializeDatabase() {
  console.log('Initializing database tables & verifying roles...');

  try {
    // 1. Initialize Roles
    const rolesToCreate = ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF'];
    const rolesMap = {};

    for (const roleName of rolesToCreate) {
      let [roleInstance] = await Role.findOrCreate({
        where: { name: roleName },
        defaults: { name: roleName }
      });
      rolesMap[roleName] = roleInstance;
    }

    // 2. Initialize Custom Super Admin from Env Variables (if provided)
    const superAdminUser = process.env.SUPER_ADMIN_USERNAME;
    const superAdminPass = process.env.SUPER_ADMIN_PASSWORD;
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@adtms.com';

    if (superAdminUser && superAdminPass) {
      const adminExists = await User.findOne({ where: { username: superAdminUser } });
      if (!adminExists) {
        console.log(`Seeding custom super admin user: ${superAdminUser}...`);
        const hashedPassword = await bcrypt.hash(superAdminPass, 10);
        const newUser = await User.create({
          username: superAdminUser,
          password: hashedPassword,
          email: superAdminEmail,
          status: 'ACTIVE'
        });
        
        // Associate with ROLE_ADMIN
        await newUser.addRole(rolesMap['ROLE_ADMIN']);
        console.log(`Custom super admin ${superAdminUser} created successfully!`);
      }
    }

    // 3. One-time migration: Update existing products with alert threshold < 20 to 20
    const existingProducts = await Product.findAll();
    let hasUpdates = false;
    for (const p of existingProducts) {
      if (p.minimumStockAlert === null || parseFloat(p.minimumStockAlert) < 20) {
        p.minimumStockAlert = 20;
        await p.save();
        hasUpdates = true;
      }
    }
    if (hasUpdates) {
      console.log('Migrated products to set minimumStockAlert threshold to at least 20.');
    }

    console.log('Database initialization completed successfully.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}


