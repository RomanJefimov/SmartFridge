export async function showAdminPanel(content, loadUsersFn) {
    content.innerHTML = `
        <div style="width:100%; padding:32px; box-sizing:border-box;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <h1 style="font-size:32px; font-weight:700;">Admin Panel</h1>
                <button id="create-user-btn" class="btn">+ Create user</button>
            </div>
            <p style="margin-bottom: 24px; color:#888;">Manage registered users</p>
            <div id="admin-status" style="margin-bottom: 12px; font-size: 14px;"></div>
            <div id="create-user-form" style="display:none; margin-bottom:24px; padding:20px; background:#F5FBFF; border:1px solid #D8EEFF; border-radius:12px;">
                <h3 style="margin-bottom:16px; font-size:16px; font-weight:700;">New User</h3>
                <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end;">
                    <input id="new-email" type="email" placeholder="Email" style="padding:8px 12px; border:1px solid #D8EEFF; border-radius:8px; font-family:Manrope,sans-serif; font-size:14px; flex:1; min-width:180px;">
                    <input id="new-password" type="password" placeholder="Password" style="padding:8px 12px; border:1px solid #D8EEFF; border-radius:8px; font-family:Manrope,sans-serif; font-size:14px; flex:1; min-width:180px;">
                    <select id="new-role" style="padding:8px 12px; border:1px solid #D8EEFF; border-radius:8px; font-family:Manrope,sans-serif; font-size:14px;">
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                    </select>
                    <button id="create-user-submit" class="btn" style="white-space:nowrap;">Create</button>
                    <button id="create-user-cancel" class="btn" style="white-space:nowrap; border-color:#ccc; color:#888;">Cancel</button>
                </div>
                <div id="create-error" style="margin-top:8px; font-size:13px; color:red;"></div>
            </div>
            <div id="users-table-wrap">
                <p>Loading users...</p>
            </div>
        </div>
    `;

    document.getElementById('create-user-btn').addEventListener('click', () => {
        document.getElementById('create-user-form').style.display = 'block';
    });

    document.getElementById('create-user-cancel').addEventListener('click', () => {
        document.getElementById('create-user-form').style.display = 'none';
        document.getElementById('create-error').textContent = '';
    });

    await loadUsersFn();
}

export async function loadUsers(token, email) {
    const wrap = document.getElementById('users-table-wrap');
    try {
        const res = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            wrap.innerHTML = `<p style="color:red;">Access denied or server error.</p>`;
            return;
        }

        const { users } = await res.json();

        if (!users.length) {
            wrap.innerHTML = `<p>No users found.</p>`;
            return;
        }

        wrap.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Last Login</th>
                        <th>Registered</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(u => `
                        <tr id="row-${u._id}">
                            <td>${u.email}</td>
                            <td>
                                <select class="role-select" data-id="${u._id}" data-email="${u.email}" style="
                                    padding: 2px 8px;
                                    border-radius: 20px;
                                    border: 1px solid #D8EEFF;
                                    font-family: Manrope, sans-serif;
                                    font-size: 12px;
                                    font-weight: 600;
                                    cursor: pointer;
                                    background: ${u.role === 'admin' ? 'rgba(255,200,0,0.15)' : 'rgba(100,180,255,0.15)'};
                                    color: ${u.role === 'admin' ? '#ffc800' : '#64b4ff'};
                                ">
                                    <option value="user" ${u.role === 'user' ? 'selected' : ''}>user</option>
                                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>admin</option>
                                </select>
                            </td>
                            <td>${u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}</td>
                            <td>${new Date(u.createdAt).toLocaleDateString()}</td>
                            <td style="display:flex; gap:8px;">
                                ${u.email !== email ? `
                                    <button class="btn-delete" data-id="${u._id}" data-email="${u.email}">Delete</button>
                                ` : '<span style="color:#888;font-size:13px;">You</span>'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        document.querySelectorAll('.role-select').forEach(select => {
            select.addEventListener('change', () => {
                updateUser(select.dataset.id, { role: select.value }, token, email);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteUser(btn.dataset.id, btn.dataset.email, token, email));
        });

        document.getElementById('create-user-submit').addEventListener('click', () => {
            createUser(token, email);
        });

    } catch (err) {
        wrap.innerHTML = `<p style="color:red;">Failed to load users.</p>`;
        console.error(err);
    }
}

export async function createUser(token, email) {
    const newEmail = document.getElementById('new-email').value.trim();
    const newPassword = document.getElementById('new-password').value;
    const newRole = document.getElementById('new-role').value;
    const errorEl = document.getElementById('create-error');
    const status = document.getElementById('admin-status');

    errorEl.textContent = '';

    if (!newEmail || !newPassword) {
        errorEl.textContent = 'Email and password are required';
        return;
    }

    try {
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole })
        });

        const data = await res.json();

        if (res.ok) {
            document.getElementById('create-user-form').style.display = 'none';
            document.getElementById('new-email').value = '';
            document.getElementById('new-password').value = '';
            status.style.color = 'green';
            status.textContent = `✓ User "${newEmail}" created.`;
            await loadUsers(token, email);
        } else {
            errorEl.textContent = data.message || 'Error creating user';
        }
    } catch (err) {
        errorEl.textContent = 'Server error';
        console.error(err);
    }
}

export async function updateUser(id, updates, token, email) {
    const status = document.getElementById('admin-status');

    try {
        const res = await fetch(`/api/admin/users/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });

        const data = await res.json();

        if (res.ok) {
            status.style.color = 'green';
            status.textContent = `✓ User updated.`;
        } else {
            status.style.color = 'red';
            status.textContent = `✗ ${data.message}`;
            await loadUsers(token, email);
        }
    } catch (err) {
        status.style.color = 'red';
        status.textContent = '✗ Failed to update user.';
        console.error(err);
    }
}

export async function deleteUser(id, userEmail, token, email) {
    const confirmed = confirm(`Delete user "${userEmail}"? This cannot be undone.`);
    if (!confirmed) return;

    const status = document.getElementById('admin-status');

    try {
        const res = await fetch(`/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        if (res.ok) {
            const row = document.getElementById(`row-${id}`);
            if (row) {
                row.style.transition = 'opacity 0.3s';
                row.style.opacity = '0';
                setTimeout(() => row.remove(), 300);
            }
            status.style.color = 'green';
            status.textContent = `✓ User "${userEmail}" deleted.`;
        } else {
            status.style.color = 'red';
            status.textContent = `✗ ${data.message}`;
        }
    } catch (err) {
        status.style.color = 'red';
        status.textContent = '✗ Failed to delete user.';
        console.error(err);
    }
}