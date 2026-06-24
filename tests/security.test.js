const assert = require("node:assert/strict");
const test = require("node:test");

process.env.JWT_SECRET = "test-secret";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const { register } = require("../controllers/authController");
const authController = require("../controllers/authController");
const analyticsController = require("../controllers/analyticsController");
const profileController = require("../controllers/profileController");
const teamController = require("../controllers/teamController");
const { authenticate } = require("../middlewares/authMiddleware");
const { createTenant } = require("../controllers/tenantController");
const { requireAdmin } = require("../middlewares/authMiddleware");
const Activity = require("../models/Activity");
const noteController = require("../controllers/noteController");
const Note = require("../models/Note");
const Tenant = require("../models/Tenant");
const User = require("../models/User");
const { updateProfileValidator } = require("../validators/profileValidators");

const createResponse = () => {
  const res = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    success(data = {}, statusCode = 200) {
      this.status(statusCode).json({ success: true, data });
      return this;
    },
  };

  return res;
};

const runController = async (controller, req) => {
  const res = createResponse();
  let thrown;
  await controller(req, res, (error) => {
    thrown = error;
  });

  if (thrown) {
    throw thrown;
  }

  return res;
};

test("public registration ignores requested role and creates a user", async (t) => {
  const originalFindTenant = Tenant.findOne;
  const originalFindUser = User.findOne;
  const originalCreateUser = User.create;
  const originalHash = bcrypt.hash;
  const originalSign = jwt.sign;

  t.after(() => {
    Tenant.findOne = originalFindTenant;
    User.findOne = originalFindUser;
    User.create = originalCreateUser;
    bcrypt.hash = originalHash;
    jwt.sign = originalSign;
  });

  Tenant.findOne = async () => ({
    _id: "tenant-1",
    slug: "acme",
    name: "Acme",
    plan: "free",
  });
  User.findOne = async () => null;
  bcrypt.hash = async () => "hashed-password";
  jwt.sign = () => "signed-token";

  let createdUser;
  User.create = async (input) => {
    createdUser = input;
    return { _id: "user-1", ...input };
  };

  const res = await runController(register, {
    body: {
      email: "new@acme.test",
      password: "password123",
      tenantSlug: "acme",
      role: "admin",
    },
  });

  assert.equal(res.statusCode, 201);
  assert.equal(createdUser.role, "user");
  assert.equal(res.body.data.user.role, "user");
});

test("tenant creation ignores requested plan and uses server default", async (t) => {
  const originalCreateTenant = Tenant.create;

  t.after(() => {
    Tenant.create = originalCreateTenant;
  });

  let createdTenant;
  Tenant.create = async (input) => {
    createdTenant = input;
    return { _id: "tenant-1", ...input };
  };

  const res = await runController(createTenant, {
    body: {
      name: "Globex",
      slug: "globex",
      plan: "pro",
    },
  });

  assert.equal(res.statusCode, 201);
  assert.equal(createdTenant.plan, "free");
  assert.equal(res.body.data.tenant.plan, "free");
});

test("admin middleware rejects users and allows admins", () => {
  const userReq = { user: { role: "user" } };
  const userRes = createResponse();
  let userNextCalled = false;

  requireAdmin(userReq, userRes, () => {
    userNextCalled = true;
  });

  assert.equal(userRes.statusCode, 403);
  assert.equal(userNextCalled, false);

  const adminReq = { user: { role: "admin" } };
  const adminRes = createResponse();
  let adminNextCalled = false;

  requireAdmin(adminReq, adminRes, () => {
    adminNextCalled = true;
  });

  assert.equal(adminRes.statusCode, 200);
  assert.equal(adminNextCalled, true);
});

test("note list queries are scoped to authenticated tenant", async (t) => {
  const originalFind = Note.find;

  t.after(() => {
    Note.find = originalFind;
  });

  let query;
  Note.find = (input) => {
    query = input;
    return {
      populate() {
        return this;
      },
      sort: async () => [],
    };
  };

  const tenant = { _id: "tenant-a" };
  const res = await runController(noteController.listNotes, { tenant });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(query, { tenantId: tenant._id });
});

test("note detail, update, and delete queries include tenantId", async (t) => {
  const originalFindOne = Note.findOne;
  const originalFindOneAndUpdate = Note.findOneAndUpdate;
  const originalFindOneAndDelete = Note.findOneAndDelete;

  t.after(() => {
    Note.findOne = originalFindOne;
    Note.findOneAndUpdate = originalFindOneAndUpdate;
    Note.findOneAndDelete = originalFindOneAndDelete;
  });

  const tenant = { _id: "tenant-b" };
  const req = {
    tenant,
    params: { id: "64b7f0f0f0f0f0f0f0f0f0f0" },
    body: { title: "Scoped", content: "" },
  };
  const queries = [];
  const note = {
    _id: req.params.id,
    title: "Scoped",
    content: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: { _id: "user-1", email: "user@test.local" },
    populate: async () => {},
  };

  Note.findOne = (query) => {
    queries.push(query);
    return {
      populate: async () => note,
    };
  };
  Note.findOneAndUpdate = async (query) => {
    queries.push(query);
    return note;
  };
  Note.findOneAndDelete = async (query) => {
    queries.push(query);
    return note;
  };

  await runController(noteController.getNote, req);
  await runController(noteController.updateNote, req);
  await runController(noteController.deleteNote, req);

  assert.equal(queries.length, 3);
  for (const query of queries) {
    assert.equal(query._id, req.params.id);
    assert.equal(query.tenantId, tenant._id);
  }
});

test("admin users cannot invite or promote owners", async (t) => {
  const originalFindOneAndUpdate = User.findOneAndUpdate;

  t.after(() => {
    User.findOneAndUpdate = originalFindOneAndUpdate;
  });

  let updateCalled = false;
  User.findOneAndUpdate = async () => {
    updateCalled = true;
    return null;
  };

  const req = {
    tenant: { _id: "tenant-a" },
    user: { _id: "admin-a", role: "admin" },
    params: { id: "64b7f0f0f0f0f0f0f0f0f0f0" },
    body: { role: "owner" },
  };

  const promoteRes = await runController(teamController.updateTeamMemberRole, req);
  assert.equal(promoteRes.statusCode, 403);
  assert.equal(updateCalled, false);

  const inviteRes = await runController(teamController.inviteTeamMember, {
    tenant: { _id: "tenant-a" },
    user: { _id: "admin-a", role: "admin" },
    body: { email: "owner@test.local", role: "owner" },
  });
  assert.equal(inviteRes.statusCode, 403);
});

test("disabled users cannot log in or use authenticated APIs", async (t) => {
  const originalFindOne = User.findOne;
  const originalFindById = User.findById;
  const originalCompare = bcrypt.compare;
  const originalVerify = jwt.verify;

  t.after(() => {
    User.findOne = originalFindOne;
    User.findById = originalFindById;
    bcrypt.compare = originalCompare;
    jwt.verify = originalVerify;
  });

  User.findOne = () => ({
    select: async () => ({
      _id: "user-disabled",
      email: "disabled@test.local",
      status: "disabled",
      passwordHash: "hash",
    }),
  });
  bcrypt.compare = async () => true;

  const loginRes = await runController(authController.login, {
    body: { email: "disabled@test.local", password: "password123" },
  });
  assert.equal(loginRes.statusCode, 403);

  jwt.verify = () => ({ userId: "user-disabled" });
  User.findById = () => ({
    select: async () => ({
      _id: "user-disabled",
      email: "disabled@test.local",
      role: "user",
      status: "disabled",
      tenantId: "tenant-a",
    }),
  });

  const apiRes = createResponse();
  let nextCalled = false;
  await authenticate(
    { get: () => "Bearer token" },
    apiRes,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(apiRes.statusCode, 403);
  assert.equal(nextCalled, false);
});

test("team, analytics, and profile operations remain tenant/user scoped", async (t) => {
  const originalFindUsers = User.find;
  const originalCountUsers = User.countDocuments;
  const originalCountNotes = Note.countDocuments;
  const originalCountActivity = Activity.countDocuments;
  const originalAggregateNotes = Note.aggregate;
  const originalCreateActivity = Activity.create;

  t.after(() => {
    User.find = originalFindUsers;
    User.countDocuments = originalCountUsers;
    Note.countDocuments = originalCountNotes;
    Activity.countDocuments = originalCountActivity;
    Note.aggregate = originalAggregateNotes;
    Activity.create = originalCreateActivity;
  });

  let teamQuery;
  User.find = (query) => {
    teamQuery = query;
    return { sort: async () => [] };
  };

  await runController(teamController.listTeamMembers, { tenant: { _id: "tenant-team" } });
  assert.deepEqual(teamQuery, { tenantId: "tenant-team" });

  const queries = [];
  Note.countDocuments = async (query) => {
    queries.push(query);
    return 0;
  };
  User.countDocuments = async (query) => {
    queries.push(query);
    return 0;
  };
  Activity.countDocuments = async (query) => {
    queries.push(query);
    return 0;
  };
  Note.aggregate = async (pipeline) => {
    queries.push(pipeline[0].$match);
    return [];
  };

  const analyticsRes = await runController(analyticsController.getAnalytics, {
    tenant: { _id: "tenant-analytics", plan: "free" },
  });

  assert.equal(analyticsRes.statusCode, 200);
  assert.equal(analyticsRes.body.data.notesCreatedOverTime.length, 14);
  assert(analyticsRes.body.data.notesCreatedOverTime.every((item) => item.count === 0));
  assert(queries.every((query) => query.tenantId === "tenant-analytics"));

  const savedUser = {
    _id: "user-profile",
    name: "",
    email: "profile@test.local",
    avatarUrl: "",
    role: "user",
    saveCalled: false,
    async save() {
      this.saveCalled = true;
    },
  };
  Activity.create = async () => ({});

  const profileRes = await runController(profileController.updateProfile, {
    tenant: { _id: "tenant-profile" },
    user: savedUser,
    body: { name: "Scoped User", avatarUrl: "" },
  });
  assert.equal(profileRes.statusCode, 200);
  assert.equal(savedUser.saveCalled, true);
  assert.equal(profileRes.body.data.profile.id, savedUser._id);
});

test("avatar validation only accepts png, jpeg, and webp data URLs under 1MB", async () => {
  const validPng = `data:image/png;base64,${Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString("base64")}`;
  const validReq = { body: { avatarUrl: validPng } };
  for (const validator of updateProfileValidator) {
    await validator.run(validReq);
  }
  assert.equal(validationResult(validReq).isEmpty(), true);

  const svgPayload = Buffer.from("<svg><script>alert(1)</script></svg>").toString("base64");
  const svgReq = { body: { avatarUrl: `data:image/svg+xml;base64,${svgPayload}` } };
  for (const validator of updateProfileValidator) {
    await validator.run(svgReq);
  }
  assert.equal(validationResult(svgReq).isEmpty(), false);

  const oversizePayload = Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff]),
    Buffer.alloc(1024 * 1024 + 1),
  ]).toString("base64");
  const oversizeReq = { body: { avatarUrl: `data:image/jpeg;base64,${oversizePayload}` } };
  for (const validator of updateProfileValidator) {
    await validator.run(oversizeReq);
  }
  assert.equal(validationResult(oversizeReq).isEmpty(), false);
});
