import { getConfirmationById } from '../models/confirmations.js';

const confirmationsApi = async (req, res) => {
  try {
    const confirmation = await getConfirmationById(req.params.id);

    if (!confirmation) {
      return res.status(404).json({
        message: 'Confirmation not found.'
      });
    }

    return res.status(200).json({ confirmation });
  } catch (error) {
    console.error('Error retrieving confirmation:', error);

    return res.status(500).json({
      message: 'An error occurred while retrieving the confirmation.'
    });
  }
};

export { confirmationsApi };
