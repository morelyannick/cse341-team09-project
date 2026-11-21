import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            enum: ['customer', 'admin'],
            unique: true,
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const Role = mongoose.models.Role || mongoose.model('Role', roleSchema);
export default Role;
