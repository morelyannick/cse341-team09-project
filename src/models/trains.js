//src/models/trains.js. 
import train from "./schemas/trains.js";

export async function getTrainById(id) {
  return train.findOne({ id }).lean();
}

export async function getAllTrains() {
  return train.find({}).lean();
}

export async function getPaginatedTrains({ filter = {}, page = 1, limit = 10, sort = 'name', order = 1 } = {}) {
  const skip = (page - 1) * limit;
  const sortOptions = { [sort]: order };

  const [trains, totalItems] = await Promise.all([
    train.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
    train.countDocuments(filter)
  ]);

  return { trains, totalItems };
}
