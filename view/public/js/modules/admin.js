export async function showAdminPanel(content, loadUsers) {
    content.innerHTML = `
        <div style="width:100%; padding:32px; box-sizing:border-box;">
            <h1 style="font-size:32px; font-weight:700; margin-bottom:8px;">Admin Panel</h1>
            <p style="margin-bottom: 24px; color:#888;">Manage registered users</p>
            <div id="admin-status" style="margin-bottom: 12px; font-size: 14px;"></div>
            <div id="users-table-wrap">
                <p>Loading users...</p>
            </div>
        </div>
    `;
    await loadUsers();
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
                            <td><span class="role-badge role-${u.role}">${u.role}</span></td>
                            <td>${u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}</td>
                            <td>${new Date(u.createdAt).toLocaleDateString()}</td>
                            <td>
                                ${u.email !== email ? `
                                    <button class="btn-delete" data-id="${u._id}" data-email="${u.email}">
                                        Delete
                                    </button>
                                ` : '<span style="color:#888;font-size:13px;">You</span>'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteUser(btn.dataset.id, btn.dataset.email, token, email));
        });

    } catch (err) {
        wrap.innerHTML = `<p style="color:red;">Failed to load users.</p>`;
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