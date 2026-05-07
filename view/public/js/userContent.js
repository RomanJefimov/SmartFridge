document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/';           
            return;                          
        }

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

    //ADMIN PANEL
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
        const token = localStorage.getItem('token');
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
        const token = localStorage.getItem('token');
 
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
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

    let fridgeData = null;

    // Function to show upload content
    function showUploadContent() {
        content.innerHTML = `
        <h1>Upload Fridge Photo</h1>
        <p style="color: var(--text-secondary, #888); margin-bottom: 24px;">
            Take a photo of your fridge and AI will analyze it
        </p>
        <label class="btn" style="cursor:pointer;">
            Upload picture
            <img src="/images/upload_icon.svg" alt="Upload icon">
            <input type="file" id="fridge-input" accept="image/*" style="display:none;">
        </label>
        <div id="preview-wrap" style="margin-top: 24px;"></div>
        <div id="analyze-status" style="margin-top: 16px; font-size: 14px;"></div>
        `;

        document.getElementById('fridge-input').addEventListener('change', handleImageUpload);
    }

    async function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const preview = document.getElementById('preview-wrap');
        const status = document.getElementById('analyze-status');
        
        // Show preview
        const url = URL.createObjectURL(file);
        preview.innerHTML = `
            <img src="${url}" style="max-width: 320px; border-radius: 12px; margin-bottom: 16px; display:block;">
            <button class="btn" id="analyze-btn">Analyze with AI</button>
        `;
        
        document.getElementById('analyze-btn').addEventListener('click', () => analyzeImage(file, status));
    }

    async function analyzeImage(file, status) {
        const token = localStorage.getItem('token');
        status.textContent = '🔍 Analyzing your fridge...';

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch('/api/fridge/analyze', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                status.textContent = '✗ ' + (data.message || 'Error');
                return;
            }

            fridgeData = data;
            status.style.color = 'green';
            status.textContent = '✓ Analysis complete! Check the menu sections.';

        } catch (err) {
            status.style.color = 'red';
            status.textContent = '✗ Failed to analyze image';
            console.error(err);
        }
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
                    content.innerHTML = fridgeData
                        ? `<h1>List of products</h1>
                           <ul style="margin-top:16px; line-height:2;">
                               ${fridgeData.products.map(p => `<li>🥦 ${p}</li>`).join('')}
                           </ul>`
                        : `<h1>List of products</h1><p>Upload a fridge photo first.</p>`;
                    break;

                case "Recipes":
                    content.innerHTML = fridgeData
                        ? `<h1>Recipes</h1>
                           ${fridgeData.recipes.map(r => `
                               <div style="margin-bottom:24px; padding:16px; border-radius:12px; background:var(--card-bg, #1e1e1e); color: var(--text-primary, #ffffff);">
                                   <h2 style="margin-bottom:8px;">${r.name}</h2>
                                   <p><strong>Ingredients:</strong> ${r.ingredients.join(', ')}</p>
                                   <ol style="margin-top:8px; line-height:1.8;">
                                       ${r.steps.map(s => `<li>${s}</li>`).join('')}
                                   </ol>
                               </div>
                           `).join('')}`
                        : `<h1>Recipes</h1><p>Upload a fridge photo first.</p>`;
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
                    content.innerHTML = fridgeData
                        ? `<h1>Analysis</h1>
                           <div style="margin-top:16px; line-height:2;">
                               <p>🔥 Calories: ${fridgeData.analysis.calories}</p>
                               <p>🥩 Proteins: ${fridgeData.analysis.proteins}</p>
                               <p>🍞 Carbs: ${fridgeData.analysis.carbs}</p>
                               <p>🧈 Fats: ${fridgeData.analysis.fats}</p>
                               <p>🥦 Vegetables: ${fridgeData.analysis.vegetables}</p>
                               <p>💡 Tip: ${fridgeData.analysis.tip}</p>
                           </div>`
                        : `<h1>Analysis</h1><p>Upload a fridge photo first.</p>`;
                    break;
                
                case "Admin panel":
                    showAdminPanel();
                    break;
            }
        });
    });

    // Show upload content by default
        document.getElementById('profilePicBtn').addEventListener('click', e => {
        e.stopPropagation();
        const d = document.getElementById('profileDropdown');
        d.style.display = d.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', () => {
        document.getElementById('profileDropdown').style.display = 'none';
    });

    document.getElementById('profileDropdown').querySelector('button').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    window.location.href = '/';
    });
});