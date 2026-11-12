import mongoose from 'mongoose';

const stationSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        prefecture: {
            type: String,
            required: true,
            trim: true
        },
        region: {
            type: String,
            required: true,
            trim: true
        },
        facilities: {
            type: [String],
            default: []
        },
        description: {
            type: String,
            required: false,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const Station = mongoose.model('Station', stationSchema);

export default Station;
