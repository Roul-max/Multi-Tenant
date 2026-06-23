require("dotenv").config();

const bcrypt = require("bcryptjs");

const connectDatabase = require("../config/database");
const validateEnv = require("../config/validateEnv");
const Tenant = require("../models/Tenant");
const User = require("../models/User");
const { ROLES } = require("../config/security");

const tenants = [
  { slug: "acme", name: "Acme Corporation", plan: "free" },
  { slug: "globex", name: "Globex Corporation", plan: "free" },
];

const users = [
  { email: "admin@acme.test", role: ROLES.ADMIN, tenantSlug: "acme" },
  { email: "user@acme.test", role: ROLES.USER, tenantSlug: "acme" },
  { email: "admin@globex.test", role: ROLES.ADMIN, tenantSlug: "globex" },
  { email: "user@globex.test", role: ROLES.USER, tenantSlug: "globex" },
];

const seed = async () => {
  validateEnv();
  await connectDatabase();

  const tenantDocs = new Map();
  for (const tenant of tenants) {
    const doc = await Tenant.findOneAndUpdate(
      { slug: tenant.slug },
      tenant,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    tenantDocs.set(tenant.slug, doc);
  }

  const passwordHash = await bcrypt.hash("password", 12);
  for (const user of users) {
    const tenant = tenantDocs.get(user.tenantSlug);
    await User.findOneAndUpdate(
      { email: user.email },
      {
        email: user.email,
        role: user.role,
        tenantId: tenant._id,
        passwordHash,
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }

  console.log("Seeded demo tenants and users");
  process.exit(0);
};

seed().catch((error) => {
  console.error("Failed to seed demo data:", error.message);
  process.exit(1);
});
