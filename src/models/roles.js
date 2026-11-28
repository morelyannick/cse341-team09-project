import Role from './schemas/roles.js';

export async function findRoleByName(name) {
    return Role.findOne({ name });
}

export async function getAllRoles() {
    return Role.find({});
}
