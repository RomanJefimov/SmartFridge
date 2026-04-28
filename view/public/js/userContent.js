document.addEventListener("DOMContentLoaded", () => {
    const content = document.querySelector(".content");
    const menuItems = document.querySelectorAll(".menu-item");

    // Show admin panel if user is admin
    const role = localStorage.getItem('role');
    const email = localStorage.getItem('email');
    
    const adminPanel = document.querySelector('.admin-panel');
    if (role === 'admin') {
        adminPanel.style.display = 'flex'; 
    }

    function setActive(element) {
        menuItems.forEach(item => item.classList.remove("active"));
        element.classList.add("active");
    }

    // ── ADMIN PANEL ──────────────────────────────────────────────
    async function showAdminPanel() {
        content.innerHTML = `
            <h1>Admin Panel</h1>
            <p style="margin-bottom: 16px; color: var(--text-secondary, #888);">Manage registered users</p>
            <div id="admin-status" style="margin-bottom: 12px; font-size: 14px;"></div>
            <div id="users-table-wrap">
                <p>Loading users...</p>
            </div>
        `;
        await loadUsers();
    }
 
    async function loadUsers() {
        const wrap = document.getElementById('users-table-wrap');
        try {
            const res = await fetch('/api/admin/users', {
                headers: { 'x-user-email': email }
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
 
            // Attach delete listeners
            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', () => deleteUser(btn.dataset.id, btn.dataset.email));
            });
 
        } catch (err) {
            wrap.innerHTML = `<p style="color:red;">Failed to load users.</p>`;
            console.error(err);
        }
    }
 
    async function deleteUser(id, userEmail) {
        const confirmed = confirm(`Delete user "${userEmail}"? This cannot be undone.`);
        if (!confirmed) return;
 
        const status = document.getElementById('admin-status');
 
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'x-user-email': email }
            });
 
            const data = await res.json();
 
            if (res.ok) {
                // Remove row from table smoothly
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

    // Function to show upload content
    function showUploadContent() {
        content.innerHTML = `
            <h1>Fridge is empty</h1>
            <button class="btn">
                Upload picture 
                <img src="/images/upload_icon.svg" alt="Upload icon">
            </button>
        `;
    }

    // Add click event listeners to menu items
    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            setActive(item);

            const text = item.textContent.trim();

            switch (text) {
                case "Upload Picture":
                    showUploadContent();
                    break;

                case "List of products":
                    content.innerHTML = `
                        <h1>List of products</h1>
                        <p>Here will be your fridge products.</p>
                    `;
                    break;

                case "Recipes":
                    content.innerHTML = `
                        <h1>Recipes</h1>
                        <p>Here will be recipes based on products.</p>
                    `;
                    break;

                case "History":
                    content.innerHTML = `
                        <h1>History</h1>
                        <p>Upload history will be shown here.</p>
                    `;
                    break;

                case "Personal characteristics":
                    content.innerHTML = `
                        <h1>Personal characteristics</h1>
                        <p>User personal information.</p>
                    `;
                    break;

                case "Analysis":
                    content.innerHTML = `
                        <h1>Analysis</h1>
                        <p>Nutrition analysis will be here.</p>
                    `;
                    break;
                
                case "Admin panel":
                    showAdminPanel();
                    break;
            }
        });
    });
});