const assert = require("node:assert/strict");
const test = require("node:test");

process.env.JWT_SECRET = "test-secret";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { register } = require("../controllers/authController");
const { createTenant } = require("../controllers/tenantController");
const { requireAdmin } = require("../middlewares/authMiddleware");
const noteController = require("../controllers/noteController");
const Note = require("../models/Note");
const Tenant = require("../models/Tenant");
const User = require("../models/User");

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
