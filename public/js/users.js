
document.addEventListener('DOMContentLoaded', () => {
    const usersList = document.getElementById('users-list');
    const loading = document.getElementById('users-loading');
    const message = document.getElementById('users-message');

    const showMessage = (text, isError = false) => {
        message.textContent = text;
        message.style.color = isError ? '#b00020' : '#2d5a4c';
    };

    const createElement = (tag, text, className) => {
        const element = document.createElement(tag);
        element.textContent = text;

        if (className) {
            element.className = className;
        }

        return element;
    };

    const loadUsers = async () => {
        loading.hidden = false;
        usersList.replaceChildren();
        showMessage('');

        try {
            const response = await fetch('/api/users');

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Unable to load users');
            }

            loading.hidden = true;

            if (!data.users.length) {
                usersList.append(
                    createElement('p', 'No users found.')
                );
                return;
            }

            data.users.forEach((user) => {
                usersList.append(createUserCard(user));
            });
        } catch (error) {
            loading.hidden = true;
            showMessage(error.message, true);
        }
    };

    const createUserCard = (user) => {
        const card = document.createElement('section');
        card.style.cssText =
            'border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 16px 0;';

        const heading = createElement('h2', user.name);
        const role = createElement('p', `Role: ${user.role}`);
        const form = document.createElement('form');

        const fields = [
            { name: 'name', label: 'Name', value: user.name },
            { name: 'username', label: 'Username', value: user.username },
            { name: 'email', label: 'Email', value: user.email }
        ];

        fields.forEach((field) => {
            const wrapper = document.createElement('div');
            wrapper.style.marginBottom = '12px';

            const label = createElement('label', field.label);
            label.htmlFor = `user-${user.id}-${field.name}`;

            const input = document.createElement('input');
            input.id = label.htmlFor;
            input.name = field.name;
            input.type = field.name === 'email' ? 'email' : 'text';
            input.value = field.value;
            input.required = true;
            input.style.cssText = 'display: block; width: 100%; max-width: 400px; padding: 8px;';

            wrapper.append(label, input);
            form.append(wrapper);
        });

        const saveButton = createElement('button', 'Save Changes');
        saveButton.type = 'submit';

        const deleteButton = createElement('button', 'Delete User');
        deleteButton.type = 'button';
        deleteButton.style.marginLeft = '10px';
        deleteButton.addEventListener('click', () => {
            deleteButton.disabled = true;
            deleteUser(user.id, deleteButton);
        });

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            saveButton.disabled = true;
            showMessage('');

            const formData = new FormData(form);
            const updates = Object.fromEntries(formData.entries());

            try {
                const response = await fetch(`/api/users/${user.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updates)
                });

                const data = await response.json();

                if (response.status === 401) {
                    window.location.href = '/login';
                    return;
                }

                if (!response.ok) {
                    throw new Error(data.error || 'Unable to update user');
                }

                showMessage('User updated successfully.');
                await loadUsers();
            } catch (error) {
                showMessage(error.message, true);
            } finally {
                saveButton.disabled = false;
            }
        });

        form.append(saveButton, deleteButton);
        card.append(heading, role, form);

        return card;
    };

    const deleteUser = async (userId, deleteButton) => {
        if (!window.confirm('Are you sure you want to delete this account? This cannot be undone.')) {
            deleteButton.disabled = false;
            return;
        }

        showMessage('');

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (!response.ok) {
                throw new Error(data.error || 'Unable to delete user');
            }

            if (data.loggedOut) {
                window.location.href = '/login';
                return;
            }

            showMessage('User deleted successfully.');
            await loadUsers();
        } catch (error) {
            deleteButton.disabled = false;
            showMessage(error.message, true);
        }
    };

    loadUsers();
});
