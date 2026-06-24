const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: ["note.created", "note.updated", "note.deleted", "user.invited", "user.role_updated", "profile.updated"],
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ["note", "user", "profile"],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ tenantId: 1, createdAt: -1 });
activitySchema.index({ tenantId: 1, action: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);
