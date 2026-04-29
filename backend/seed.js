require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected');

  const admins = [
    {
      fullName: 'Super Admin',
      email: 'admin@civiclens.gov',
      password: 'Admin@123456', // ✅ plain
      role: 'superadmin',
    },
    {
      fullName: 'Roads Authority',
      email: 'roads@civiclens.gov',
      password: 'Admin@123456',
      role: 'authority',
    },
  ];

  for (const a of admins) {
    const exists = await User.findOne({ email: a.email });

    if (exists) {
      console.log(`⚠️ Skipping ${a.email}`);
      continue;
    }

    await User.create(a); // ✅ let pre-save hash handle it
    console.log(`✅ Created ${a.email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed();