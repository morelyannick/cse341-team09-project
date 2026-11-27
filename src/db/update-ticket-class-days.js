// One-time update for an existing database: adds availableDays to each ticket
// class from the seed file. Unlike `npm run db:import`, it does not delete or
// reload any other collection, so bookings in the shared team database are kept.
// Run with: npm run db:ticket-days
import { closeDb, connectToDb } from './connect.js';
import ticketClasses from './seeds/ticket-classes.json' with { type: 'json' };

try {
  const db = await connectToDb();
  const collection = db.collection('ticketClasses');

  for (const ticketClass of ticketClasses) {
    const result = await collection.updateOne(
      { class: ticketClass.class },
      { $set: { availableDays: ticketClass.availableDays } }
    );
    const status = result.matchedCount === 1 ? 'updated' : 'not found';
    console.log(`${ticketClass.class}: ${status} -> ${ticketClass.availableDays.join(', ')}`);
  }

  console.log('Ticket class availability update complete.');
} finally {
  await closeDb();
}
