// src/controllers/schedules.js
import { getSchedulesByTripId } from '../models/schedules.js';

export async function getSchedulesForTrip(req, res) {
  try {
    const { id } = req.params;
    const { month } = req.query;

    if (month !== undefined) {
      const monthNum = Number(month);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          error: "Invalid month parameter. Must be a number between 1 and 12.",
        });
      }
    }

    const schedules = await getSchedulesByTripId(id, month);

    // Corregido: schedules (en plural)
    if (!schedules || schedules.length === 0) {
      return res.status(404).json({
        error: "No schedules found for this trip",
      });
    }
    return res.status(200).json(schedules);
  
  } catch (error) {
    console.error("Error fetching schedules for trip:", error);
    return res.status(500).json({
      error: "Failed to fetch schedules for trip",
    });
  }
}

export async function getSchedulesForTripAndMonth(req, res) {
  try {
    // Corregido: extraemos tanto 'id' como 'month' de req.params
    const { id, month } = req.params;
    const monthNum = Number(month);

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        error: "Invalid month parameter. Must be a number between 1 and 12.",
      });
    }

    const schedules = await getSchedulesByTripId(id, month);

    if (!schedules || schedules.length === 0) {
      return res.status(404).json({
        error: "No schedules found for this trip and month.",
      });
    } 
    return res.status(200).json(schedules);

  } catch (error) {
    console.error("Error fetching schedules for trip and month:", error);
    return res.status(500).json({
      error: "Failed to fetch schedules for trip and month",
    });
  }
}