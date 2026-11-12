import { getDb } from '../db/connect.js';

export async function getAllStations() {
    return getDb().collection('stations').find({}).toArray();
}

export async function getStationById(id) {
    return getDb().collection('stations').findOne({ id });
}
