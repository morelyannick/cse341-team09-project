//src/controllers/trains.js
import {
  getTrainById as findTrainById,
  getAllTrains as findAllTrains,
  getPaginatedTrains as findPaginatedTrains,
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

const allowedSortFields = ["name", "maxSpeedKmh", "capacity"];
const allowedPowerSources = ["Electric", "Diesel", "Steam"];

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

    const filter = {};

    // Power source filter validation
    if (req.query.powerSource !== undefined && req.query.powerSource !== "") {
      const matchedPower = allowedPowerSources.find(
        (p) => p.toLowerCase() === req.query.powerSource.trim().toLowerCase()
      );
      if (!matchedPower) {
        errors.push({
          field: "powerSource",
          message: `powerSource must be one of: ${allowedPowerSources.join(", ")}.`,
        });
      } else {
        filter.powerSource = matchedPower;
      }
    }

    // Keyword search validation
    if (req.query.q !== undefined && req.query.q !== "") {
      if (typeof req.query.q !== "string" || req.query.q.trim().length > 100) {
        errors.push({
          field: "q",
          message: "Search query q must be a string up to 100 characters.",
        });
      } else {
        const escapedQuery = req.query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const searchRegex = new RegExp(escapedQuery, "i");
        filter.$or = [
          { name: searchRegex },
          { description: searchRegex },
          { bestFor: searchRegex },
          { operator: searchRegex },
        ];
      }
    }

    // Sort validation
    let sort = "name";
    if (req.query.sort !== undefined && req.query.sort !== "") {
      if (!allowedSortFields.includes(req.query.sort)) {
        errors.push({
          field: "sort",
          message: `sort must be one of: ${allowedSortFields.join(", ")}.`,
        });
      } else {
        sort = req.query.sort;
      }
    }

    // Order validation
    let order = 1;
    if (req.query.order !== undefined && req.query.order !== "") {
      const normalizedOrder = req.query.order.trim().toLowerCase();
      if (!["asc", "desc"].includes(normalizedOrder)) {
        errors.push({
          field: "order",
          message: "order must be either asc or desc.",
        });
      } else {
        order = normalizedOrder === "desc" ? -1 : 1;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const { trains, totalItems } = await findPaginatedTrains({
      filter,
      page,
      limit,
      sort,
      order,
    });

    const totalPages = Math.ceil(totalItems / limit) || 0;

    return res.status(200).json({
      trains,
      query: {
        q: req.query.q ? req.query.q.trim() : undefined,
        powerSource: filter.powerSource || undefined,
        sort,
        order: order === -1 ? "desc" : "asc",
      },
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