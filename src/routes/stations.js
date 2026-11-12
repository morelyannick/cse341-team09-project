import { getAllStations, getStationById } from '../models/stations.js';

const stationsApi = async (req, res, next) => {
    try {
        const stations = await getAllStations();
        return res.status(200).json({ stations });
    } catch (error) {
        return next(error);
    }
};

const stationDetailsApi = async (req, res, next) => {
    try {
        const { id } = req.params;
        const station = await getStationById(id);

        if (!station) {
            return res.status(404).json({ message: 'Station not found' });
        }

        return res.status(200).json({ station });
    } catch (error) {
        return next(error);
    }
};

export { stationsApi, stationDetailsApi };

