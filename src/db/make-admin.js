// Gives an existing user the admin role, so admin-only pages can be tested.
// Register the account at /register first, then run:
//   npm run db:make-admin -- you@example.com
import { closeDb, connectToDb } from './connect.js';

const email = (process.argv[2] || '').trim().toLowerCase();

if (!email) {
  console.error('Usage: npm run db:make-admin -- you@example.com');
  process.exitCode = 1;
} else {
  try {
    const db = await connectToDb();
    const adminRole = await db.collection('roles').findOne({ name: 'admin' });

    if (!adminRole) {
      console.error('No "admin" role found. Run npm run db:import first.');
      process.exitCode = 1;
    } else {
      const result = await db.collection('users').updateOne({ email }, { $set: { role: adminRole._id } });
      if (result.matchedCount === 0) {
        console.error(`No user with email ${email}. Register the account at /register first.`);
        process.exitCode = 1;
      } else {
        console.log(`${email} is now an admin. Sign out and sign in again to refresh your session.`);
      }
    }
  } finally {
    await closeDb();
  }
}
