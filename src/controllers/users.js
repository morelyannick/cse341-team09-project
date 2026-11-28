
import mongoose from 'mongoose';
import User from '../models/schemas/users.js';

const formatUser = (user) => ({
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role?.name || 'customer',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
});

const canManageUser = (req, userId) => {
    return req.user.role === 'admin' || req.user.id === userId;
};

export async function getUsers(req, res) {
    try {
        const filter = req.user.role === 'admin'
            ? {}
            : { _id: req.user.id };

        const users = await User.find(filter)
            .populate('role')
            .sort({ name: 1 });

        return res.status(200).json({
            users: users.map(formatUser)
        });
    } catch (error) {
        console.error('Error fetching users:', error);

        return res.status(500).json({
            error: 'Failed to fetch users'
        });
    }
}

export async function updateUser(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                error: 'Invalid user ID'
            });
        }

        if (!canManageUser(req, id)) {
            return res.status(403).json({
                error: 'You do not have permission to update this user'
            });
        }

        const allowedFields = ['name', 'username', 'email'];
        const requestBody = req.body || {};
        const submittedFields = Object.keys(requestBody);

        if (
            submittedFields.length === 0 ||
            submittedFields.some((field) => !allowedFields.includes(field))
        ) {
            return res.status(400).json({
                error: 'Only name, username, and email can be updated'
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        for (const field of allowedFields) {
            if (Object.hasOwn(requestBody, field)) {
                if (typeof requestBody[field] !== 'string' || !requestBody[field].trim()) {
                    return res.status(400).json({
                        error: `${field} must be a non-empty string`
                    });
                }

                user[field] = requestBody[field].trim();
            }
        }

        const duplicateConditions = [];

        if (Object.hasOwn(requestBody, 'email')) {
            duplicateConditions.push({
                email: requestBody.email.trim().toLowerCase()
            });
        }

        if (Object.hasOwn(requestBody, 'username')) {
            duplicateConditions.push({
                username: requestBody.username.trim().toLowerCase()
            });
        }

        if (duplicateConditions.length > 0) {
            const duplicateUser = await User.findOne({
                _id: { $ne: id },
                $or: duplicateConditions
            });

            if (duplicateUser) {
                return res.status(409).json({
                    error: 'Username or email already exists'
                });
            }
        }
        await user.save();
        await user.populate('role');

        if (req.user.id === id) {
            req.session.user.name = user.name;
            req.session.user.username = user.username;
            req.session.user.email = user.email;
        }

        return res.status(200).json({
            message: 'User updated successfully',
            user: formatUser(user)
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                error: 'Username or email already exists'
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Invalid user information'
            });
        }

        console.error('Error updating user:', error);

        return res.status(500).json({
            error: 'Failed to update user'
        });
    }
}

export async function deleteUser(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                error: 'Invalid user ID'
            });
        }

        if (!canManageUser(req, id)) {
            return res.status(403).json({
                error: 'You do not have permission to delete this user'
            });
        }

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        if (req.user.id === id) {
            return req.session.destroy((error) => {
                if (error) {
                    console.error('Error destroying session:', error);

                    return res.status(500).json({
                        error: 'Account deleted, but session could not be ended'
                    });
                }

                res.clearCookie('connect.sid');

                return res.status(200).json({
                    message: 'Account deleted successfully',
                    loggedOut: true
                });
            });
        }

        return res.status(200).json({
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);

        return res.status(500).json({
            error: 'Failed to delete user'
        });
    }
}
