import confirmation from './schemas/confirmations.js';

export async function createConfirmation(data) {
  const newConfirmation = new confirmation(data);
  return newConfirmation.save();
}

export async function getConfirmationById(id) {
  return confirmation.findOne({ id }).lean();
}
