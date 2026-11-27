import bcrypt from 'bcrypt';
import User from './schemas/users.js';
import Role from './schemas/roles.js';

export async function createUser({ name, username, email, password, roleName = 'customer' }) {
    let roleDoc = await Role.findOne({ name: roleName });
    if (!roleDoc) {
        roleDoc = await Role.create({ name: roleName });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
        name,
        username,
        email: email.toLowerCase(),
        passwordHash,
        role: roleDoc._id
    });

    return user;
}

export async function findUserByEmail(email) {
    return User.findOne({ email: email.toLowerCase() }).populate('role');
}

export async function findUserByUsername(username) {
    return User.findOne({ username: username.toLowerCase() }).populate('role');
}

export async function findUserById(id) {
    return User.findById(id).populate('role');
}

export async function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}
