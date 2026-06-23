const Tenant = require("../models/Tenant");
const { DEFAULT_PLAN, PLANS } = require("../config/security");

const serializeTenant = (tenant) => ({
  id: tenant._id,
  slug: tenant.slug,
  name: tenant.name,
  plan: tenant.plan,
});

const createTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.create({
      name: req.body.name,
      slug: req.body.slug,
      plan: DEFAULT_PLAN,
    });

    return res.success({ tenant: serializeTenant(tenant) }, 201);
  } catch (error) {
    next(error);
  }
};

const upgradeTenant = async (req, res, next) => {
  try {
    if (req.tenant.slug !== req.params.slug) {
      return res.status(403).json({
        success: false,
        message: "Cannot upgrade a different tenant",
      });
    }

    const tenant = await Tenant.findOneAndUpdate(
      { _id: req.tenant._id, slug: req.params.slug },
      { plan: PLANS.PRO },
      { new: true, runValidators: true }
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    return res.success({
      tenant: serializeTenant(tenant),
      message: `Successfully updated to ${tenant.plan} plan`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTenant, upgradeTenant };
