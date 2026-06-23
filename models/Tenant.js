const mongoose = require("mongoose");
const { DEFAULT_PLAN, PLAN_VALUES } = require("../config/security");

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      maxlength: 80,
    },
    plan: {
      type: String,
      enum: PLAN_VALUES,
      default: DEFAULT_PLAN,
    },
  },
  {
    timestamps: true,
  }
);

tenantSchema.index({ name: 1 }, { unique: true });
tenantSchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model("Tenant", tenantSchema);
