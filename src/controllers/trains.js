//src/controllers/trains.js
import {
  getTrainById as findTrainById,
  getAllTrains as findAllTrains,
  getPaginatedTrains as findPaginatedTrains
} from "../models/trains.js";

const parsePositiveInteger = (value, defaultValue) => {
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }
  return parsed;
};

export async function getTrainById(req, res) {
  try {
    const { id } = req.params;

    const train = await findTrainById(id);

    if (!train) {
      return res.status(404).json({
        error: "Train not found",
      });
    }

    return res.status(200).json(train);
  } catch (error) {
    console.error("Error fetching train:", error);

    return res.status(500).json({
      error: "Failed to fetch train",
    });
  }
}

export async function getAllTrains(req, res) {
  try {
    const errors = [];

    const page = parsePositiveInteger(req.query.page, 1);
    if (page === null) {
      errors.push({ field: "page", message: "page must be a positive integer." });
    }

    const limit = parsePositiveInteger(req.query.limit, 10);
    if (limit === null || limit > 50) {
      errors.push({ field: "limit", message: "limit must be a positive integer not exceeding 50." });
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const { trains, totalItems } = await findPaginatedTrains({
      filter: {},
      page,
      limit,
      sort: "name",
      order: 1,
    });

    const totalPages = Math.ceil(totalItems / limit) || 0;

    return res.status(200).json({
      trains,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching trains:", error);

    return res.status(500).json({
      error: "Failed to fetch trains",
    });
  }
}