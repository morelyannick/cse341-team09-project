import {
  getAllTicketClasses as findAllTicketClasses,
  getTicketClassesForDay as findTicketClassesForDay
} from '../models/ticket-classes.js';
import { DAYS_OF_WEEK } from '../models/schemas/ticket-classes.js';

export async function getAllTicketClasses(req, res) {
  try {
    const ticketClasses = await findAllTicketClasses();
    return res.status(200).json({ ticketClasses });
  } catch (error) {
    console.error('Error fetching ticket classes:', error);
    return res.status(500).json({ error: 'Failed to fetch ticket classes' });
  }
}

export async function getTicketClassesForDay(req, res) {
  const dayValue = req.query.day;
  const day = typeof dayValue === 'string' ? dayValue.trim().toLowerCase() : '';

  if (!DAYS_OF_WEEK.includes(day)) {
    return res.status(400).json({
      error: `Day must be one of: ${DAYS_OF_WEEK.join(', ')}`
    });
  }

  try {
    const ticketClasses = await findTicketClassesForDay(day);
    return res.status(200).json({ day, ticketClasses });
  } catch (error) {
    console.error(`Error fetching ticket classes for ${day}:`, error);
    return res.status(500).json({ error: 'Failed to fetch ticket classes' });
  }
}
