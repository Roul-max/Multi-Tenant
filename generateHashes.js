import bcrypt from 'bcryptjs';

// List of all test accounts
const users = [
  'admin@acme.test',
  'user@acme.test',
  'admin@globex.test',
  'user@globex.test',
];

// Plain password for all accounts
const password = 'password';

users.forEach((email) => {
  const hash = bcrypt.hashSync(password, 10); // 10 = salt rounds
  console.log(`${email} -> ${hash}`);
});
