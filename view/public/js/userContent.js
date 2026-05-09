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

    let fridgeData = null;
    
    // Load latest fridge data on page load
    async function loadLatest() {
           try {
               const res = await fetch('/api/fridge/latest', {
                   headers: { 'Authorization': `Bearer ${token}` }
               });
               const data = await res.json();
               if (data.latest) {
                   fridgeData = data.latest;
               }
           } catch (err) {
               console.error(err);
           }
       }

       loadLatest();

    const adminPanel = document.querySelector('.admin-panel');
    if (role === 'admin') {
        adminPanel.style.display = 'flex'; 
    }

    function setActive(element) {
        menuItems.forEach(item => item.classList.remove("active"));
        element.classList.add("active");
        localStorage.setItem('activeSection', element.textContent.trim());
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

    // Function to show upload content
    function showUploadContent() {
        content.innerHTML = `
        <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:22px;">
            <h1 style="font-size:64px; font-weight:400;">Upload Fridge Photo</h1>
            <p style="color: var(--text-secondary, #888);">
                Take a photo of your fridge and AI will analyze it
            </p>
            <label class="btn" style="cursor:pointer;">
                Upload picture
                <img src="/images/upload_icon.svg" alt="Upload icon">
                <input type="file" id="fridge-input" accept="image/*" style="display:none;">
            </label>
            <div id="preview-wrap" style="margin-top: 24px;"></div>
            <div id="analyze-status" style="margin-top: 16px; font-size: 14px;"></div>
        </div>
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

    function showProducts(editMode = false) {
    const products = fridgeData.products;

    content.innerHTML = `
        <div style="width:100%; padding: 32px; box-sizing:border-box;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
                <h1 style="font-size:32px; font-weight:700;">List of products</h1>
                ${editMode
                    ? `<button class="btn" id="save-btn">✓ Save</button>`
                    : `<button class="btn" id="edit-btn">✏️ Edit</button>`
                }
            </div>
            <div id="products-grid" style="
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                gap: 12px;
            ">
                ${products.map((p, i) => `
                    <div style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 12px 16px;
                        background: #F5FBFF;
                        border: 1px solid #D8EEFF;
                        border-radius: 12px;
                        font-size: 15px;
                        gap: 8px;
                    ">
                        <span>🥦 ${p}</span>
                        ${editMode ? `
                            <button data-index="${i}" class="remove-btn" style="
                                background: none;
                                border: none;
                                color: #ff4646;
                                cursor: pointer;
                                font-size: 16px;
                                padding: 0;
                                line-height: 1;
                            ">✕</button>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            <div id="update-recipes-wrap" style="margin-top:24px;"></div>
        </div>
    `;

    if (editMode) {
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                fridgeData.products.splice(index, 1);
                showProducts(true);
            });
        });

        document.getElementById('save-btn').addEventListener('click', async () => {
            try {
                const res = await fetch('/api/fridge/products', {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id: fridgeData._id, products: fridgeData.products })
                });

                if (res.ok) {
                    showProducts(false);
                    document.getElementById('update-recipes-wrap').innerHTML = `
                        <button class="btn" id="update-recipes-btn">🔄 Update recipes based on new products</button>
                    `;
                    document.getElementById('update-recipes-btn').addEventListener('click', updateRecipes);
                }
            } catch (err) {
                console.error(err);
            }
        });
    } else {
        document.getElementById('edit-btn').addEventListener('click', () => showProducts(true));
    }
}

async function updateRecipes() {
    const wrap = document.getElementById('update-recipes-wrap');
    wrap.innerHTML = `<p>🔍 Updating recipes...</p>`;

    try {
        const res = await fetch('/api/fridge/recipes', {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: fridgeData._id, products: fridgeData.products })
        });

        const data = await res.json();

        if (res.ok) {
            fridgeData.recipes = data.recipes;
            wrap.innerHTML = `<p style="color:green;">✓ Recipes updated! Check the Recipes section.</p>`;
        } else {
            wrap.innerHTML = `<p style="color:red;">✗ Failed to update recipes.</p>`;
        }
    } catch (err) {
        wrap.innerHTML = `<p style="color:red;">✗ Error updating recipes.</p>`;
        console.error(err);
    }
}

    function showRecipes() {
        const recipes = fridgeData.recipes;
        let current = 0;

        function render() {
            const r = recipes[current];
            content.innerHTML = `
                <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:32px; box-sizing:border-box;">

                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:24px; color:#888; font-size:14px;">
                        <span>${current + 1} / ${recipes.length}</span>
                    </div>

                    <div style="
                        width: 100%;
                        max-width: 640px;
                        background: #F5FBFF;
                        border: 1px solid #D8EEFF;
                        border-radius: 20px;
                        padding: 32px;
                        box-sizing: border-box;
                        min-height: 360px;
                    ">
                        <h2 style="font-size:24px; font-weight:700; margin-bottom:16px;">${r.name}</h2>

                        <div style="margin-bottom:20px;">
                            <p style="font-size:13px; text-transform:uppercase; color:#888; font-weight:600; margin-bottom:8px;">Ingredients</p>
                            <div style="display:flex; flex-wrap:wrap; gap:8px;">
                                ${r.ingredients.map(ing => `
                                    <span style="
                                        padding: 4px 12px;
                                        background: #D8EEFF;
                                        border-radius: 20px;
                                        font-size: 13px;
                                        color: #009FE3;
                                        font-weight: 600;
                                    ">${ing}</span>
                                `).join('')}
                            </div>
                        </div>

                        <div>
                            <p style="font-size:13px; text-transform:uppercase; color:#888; font-weight:600; margin-bottom:8px;">Steps</p>
                            <ol style="padding-left:20px; line-height:2; font-size:15px;">
                                ${r.steps.map(s => `<li>${s}</li>`).join('')}
                            </ol>
                        </div>
                    </div>

                    <div style="display:flex; align-items:center; gap:24px; margin-top:28px;">
                        <button id="prev-btn" class="btn" ${current === 0 ? 'disabled style="opacity:0.4; cursor:default;"' : ''}>← Prev</button>
                        <div style="display:flex; gap:8px;">
                            ${recipes.map((_, i) => `
                                <div style="
                                    width: 8px; height: 8px;
                                    border-radius: 50%;
                                    background: ${i === current ? '#009FE3' : '#bfdff8'};
                                    transition: background 0.2s;
                                "></div>
                            `).join('')}
                        </div>
                        <button id="next-btn" class="btn" ${current === recipes.length - 1 ? 'disabled style="opacity:0.4; cursor:default;"' : ''}>Next →</button>
                    </div>

                </div>
            `;

            if (current > 0) {
                document.getElementById('prev-btn').addEventListener('click', () => {
                    current--;
                    render();
                });
            }

            if (current < recipes.length - 1) {
                document.getElementById('next-btn').addEventListener('click', () => {
                    current++;
                    render();
                });
            }
        }

        render();
    }

    async function showHistory() {
        content.innerHTML = `<h1>History</h1><p>Loading...</p>`;

        try {
            const res = await fetch('/api/fridge/history', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const { history } = await res.json();

            if (!history.length) {
                content.innerHTML = `<h1>History</h1><p>No uploads yet.</p>`;
                return;
            }

            content.innerHTML = `
                <h1>History</h1>
                <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 16px;">
                    ${history.map(h => `
                        <div class="history-card" data-id="${h._id}" style="padding: 16px; border-radius: 12px; background: var(--card-bg, #F5FBFF); cursor: pointer;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: 600;">🧊 ${new Date(h.createdAt).toLocaleString()}</span>
                                <span style="font-size: 13px; color: #888;">${h.products.length} products</span>
                            </div>
                            <p style="margin-top: 8px; font-size: 13px; color: #aaa;">${h.products.slice(0, 5).join(', ')}${h.products.length > 5 ? '...' : ''}</p>
                        </div>
                    `).join('')}
                </div>
            `;

            document.querySelectorAll('.history-card').forEach(card => {
                card.addEventListener('click', () => {
                    const entry = history.find(h => h._id === card.dataset.id);
                    if (entry) {
                        fridgeData = entry;
                        content.innerHTML = `
                            <h1>✅ Loaded from ${new Date(entry.createdAt).toLocaleDateString()}</h1>
                            <p style="color:#888; margin-top:8px;">Now check List of products, Recipes, or Analysis.</p>
                        `;
                    }
                });
            });

        } catch (err) {
            content.innerHTML = `<h1>History</h1><p style="color:red;">Failed to load history.</p>`;
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
                    if (fridgeData) {
                    showProducts();
                    } else {
                    content.innerHTML = `<h1>List of products</h1><p>Upload a fridge photo first.</p>`;
                    }
                    break;

                case "Recipes":
                    if (fridgeData) {
                        showRecipes();
                    } else {
                        content.innerHTML = `<h1>Recipes</h1><p>Upload a fridge photo first.</p>`;
                    }
                    break;
                        
                case "History":
                        showHistory();
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

    const savedSection = localStorage.getItem('activeSection') || 'Upload Picture';
    const defaultItem = [...menuItems].find(i => i.textContent.trim() === savedSection);
    if (defaultItem) {
        setActive(defaultItem);
        defaultItem.click();
    }

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
    localStorage.removeItem('activeSection');
    window.location.href = '/';
    });
});