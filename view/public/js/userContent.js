document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/';           
            return;                          
        }

    const content = document.querySelector(".content");
    const menuItems = document.querySelectorAll(".menu-item");

    const role = localStorage.getItem('role');
    const email = localStorage.getItem('email');

    let fridgeData = null;
    
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

    function renderRecipeSlide(recipes, current) {
        const r = recipes[current];
        return `
            <div style="padding:16px; background:#F5FBFF; border-radius:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h3 style="font-size:16px;">${r.name}</h3>
                    <span style="font-size:13px; color:#888;">${current + 1} / ${recipes.length}</span>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;">
                    ${r.ingredients.map(ing => `
                        <span style="padding:3px 10px; background:#D8EEFF; border-radius:20px; font-size:12px; color:#009FE3; font-weight:600;">${ing}</span>
                    `).join('')}
                </div>
                <ol style="padding-left:20px; font-size:14px; line-height:1.8;">
                    ${r.steps.map(s => `<li>${s}</li>`).join('')}
                </ol>
                <div style="display:flex; justify-content:center; align-items:center; gap:16px; margin-top:16px;">
                    <button id="hr-prev" class="btn" ${current === 0 ? 'disabled style="opacity:0.4;"' : ''}>← Prev</button>
                    <div style="display:flex; gap:6px;">
                        ${recipes.map((_, i) => `<div style="width:7px; height:7px; border-radius:50%; background:${i === current ? '#009FE3' : '#D8EEFF'};"></div>`).join('')}
                    </div>
                    <button id="hr-next" class="btn" ${current === recipes.length - 1 ? 'disabled style="opacity:0.4;"' : ''}>Next →</button>
                </div>
            </div>
        `;
    }

    function attachRecipeSlider(recipes, current) {
        const prev = document.getElementById('hr-prev');
        const next = document.getElementById('hr-next');
        const slider = document.getElementById('history-recipe-slider');

        if (prev && current > 0) {
            prev.addEventListener('click', () => {
                slider.innerHTML = renderRecipeSlide(recipes, current - 1);
                attachRecipeSlider(recipes, current - 1);
            });
        }
        if (next && current < recipes.length - 1) {
            next.addEventListener('click', () => {
                slider.innerHTML = renderRecipeSlide(recipes, current + 1);
                attachRecipeSlider(recipes, current + 1);
            });
        }
    }

    async function showHistory() {
        content.innerHTML = `<div style="width:100%; padding:32px; box-sizing:border-box;"><h1 style="font-size:32px; font-weight:700; margin-bottom:24px;">History</h1><p>Loading...</p></div>`;

        try {
            const res = await fetch('/api/fridge/history', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const { history } = await res.json();

            if (!history.length) {
                content.innerHTML = `<div style="width:100%; padding:32px; box-sizing:border-box;"><h1 style="font-size:32px; font-weight:700;">History</h1><p style="margin-top:16px; color:#888;">No uploads yet.</p></div>`;
                return;
            }

            function renderHistory(openId = null) {
                content.innerHTML = `
                    <div style="width:100%; padding:32px; box-sizing:border-box; overflow-y:auto;">
                        <h1 style="font-size:32px; font-weight:700; margin-bottom:24px;">History</h1>
                        <div style="display:flex; flex-direction:column; gap:12px;">
                            ${history.map(h => {
                                const isOpen = h._id === openId;
                                return `
                                    <div style="border:1px solid #D8EEFF; border-radius:16px; overflow:hidden;">
                                        <div class="history-card" data-id="${h._id}" style="
                                            padding: 16px 20px;
                                            background: #F5FBFF;
                                            cursor: pointer;
                                            display: flex;
                                            justify-content: space-between;
                                            align-items: center;
                                        ">
                                            <div>
                                                <div style="font-weight:700; font-size:15px;">🧊 ${new Date(h.createdAt).toLocaleString()}</div>
                                                <div style="font-size:13px; color:#888; margin-top:4px;">${h.products.slice(0, 5).join(', ')}${h.products.length > 5 ? '...' : ''}</div>
                                            </div>
                                            <div style="display:flex; align-items:center; gap:12px;">
                                                <span style="font-size:13px; color:#009FE3; font-weight:600;">${h.products.length} products</span>
                                                <span style="font-size:18px; color:#009FE3;">${isOpen ? '▲' : '▼'}</span>
                                            </div>
                                        </div>

                                        ${isOpen ? `
                                            <div style="padding:24px; background:#fff; border-top:1px solid #D8EEFF;">
                                                <div id="history-tabs" style="display:flex; gap:8px; margin-bottom:20px;">
                                                    <button class="history-tab" data-tab="products" style="padding:6px 16px; border-radius:20px; border:1px solid #009FE3; background:#009FE3; color:#fff; cursor:pointer; font-size:14px; font-family:Manrope,sans-serif;">Products</button>
                                                    <button class="history-tab" data-tab="recipes" style="padding:6px 16px; border-radius:20px; border:1px solid #D8EEFF; background:transparent; color:#009FE3; cursor:pointer; font-size:14px; font-family:Manrope,sans-serif;">Recipes</button>
                                                    <button class="history-tab" data-tab="analysis" style="padding:6px 16px; border-radius:20px; border:1px solid #D8EEFF; background:transparent; color:#009FE3; cursor:pointer; font-size:14px; font-family:Manrope,sans-serif;">Analysis</button>
                                                </div>

                                                <div id="tab-products">
                                                    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:8px;">
                                                        ${h.products.map(p => `
                                                            <div style="padding:8px 12px; background:#F5FBFF; border:1px solid #D8EEFF; border-radius:10px; font-size:14px;">🥦 ${p}</div>
                                                        `).join('')}
                                                    </div>
                                                </div>

                                                <div id="tab-recipes" style="display:none;">
                                                    <div id="history-recipe-slider">
                                                        ${renderRecipeSlide(h.recipes, 0)}
                                                    </div>
                                                </div>

                                                <div id="tab-analysis" style="display:none;">
                                                    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:12px;">
                                                        <div style="padding:16px; background:#F5FBFF; border-radius:12px; border:1px solid #D8EEFF;">🔥 <strong>Calories</strong><br>${h.analysis.calories}</div>
                                                        <div style="padding:16px; background:#F5FBFF; border-radius:12px; border:1px solid #D8EEFF;">🥩 <strong>Proteins</strong><br>${h.analysis.proteins}</div>
                                                        <div style="padding:16px; background:#F5FBFF; border-radius:12px; border:1px solid #D8EEFF;">🍞 <strong>Carbs</strong><br>${h.analysis.carbs}</div>
                                                        <div style="padding:16px; background:#F5FBFF; border-radius:12px; border:1px solid #D8EEFF;">🧈 <strong>Fats</strong><br>${h.analysis.fats}</div>
                                                        <div style="padding:16px; background:#F5FBFF; border-radius:12px; border:1px solid #D8EEFF;">🥦 <strong>Vegetables</strong><br>${h.analysis.vegetables}</div>
                                                        <div style="padding:16px; background:#F5FBFF; border-radius:12px; border:1px solid #D8EEFF; grid-column:1/-1;">💡 <strong>Tip:</strong> ${h.analysis.tip}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;

                document.querySelectorAll('.history-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const id = card.dataset.id;
                        renderHistory(openId === id ? null : id);
                    });
                });

                document.querySelectorAll('.history-tab').forEach(tab => {
                    tab.addEventListener('click', () => {
                        document.querySelectorAll('.history-tab').forEach(t => {
                            t.style.background = 'transparent';
                            t.style.color = '#009FE3';
                        });
                        tab.style.background = '#009FE3';
                        tab.style.color = '#fff';

                        document.getElementById('tab-products').style.display = 'none';
                        document.getElementById('tab-recipes').style.display = 'none';
                        document.getElementById('tab-analysis').style.display = 'none';
                        document.getElementById(`tab-${tab.dataset.tab}`).style.display = 'block';

                        if (tab.dataset.tab === 'recipes') {
                            const entry = history.find(h => h._id === openId);
                            if (entry) attachRecipeSlider(entry.recipes, 0);
                        }
                    });
                });
            }

            renderHistory();

        } catch (err) {
            content.innerHTML = `<div style="padding:32px;"><h1>History</h1><p style="color:red;">Failed to load history.</p></div>`;
            console.error(err);
        }
    }

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
                        ? `<div style="width:100%; padding:32px; box-sizing:border-box;">
                               <h1 style="font-size:32px; font-weight:700; margin-bottom:24px;">Analysis</h1>
                               <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:16px;">
                                   <div style="padding:24px; background:#FFF5F0; border:1px solid #FFD8C0; border-radius:16px;">
                                       <div style="font-size:28px; margin-bottom:8px;">🔥</div>
                                       <div style="font-size:12px; text-transform:uppercase; color:#888; font-weight:600; margin-bottom:4px;">Calories</div>
                                       <div style="font-size:18px; font-weight:700;">${fridgeData.analysis.calories}</div>
                                   </div>
                                   <div style="padding:24px; background:#FFF0F0; border:1px solid #FFD0D0; border-radius:16px;">
                                       <div style="font-size:28px; margin-bottom:8px;">🥩</div>
                                       <div style="font-size:12px; text-transform:uppercase; color:#888; font-weight:600; margin-bottom:4px;">Proteins</div>
                                       <div style="font-size:18px; font-weight:700;">${fridgeData.analysis.proteins}</div>
                                   </div>
                                   <div style="padding:24px; background:#FFFBF0; border:1px solid #FFE8A0; border-radius:16px;">
                                       <div style="font-size:28px; margin-bottom:8px;">🍞</div>
                                       <div style="font-size:12px; text-transform:uppercase; color:#888; font-weight:600; margin-bottom:4px;">Carbs</div>
                                       <div style="font-size:18px; font-weight:700;">${fridgeData.analysis.carbs}</div>
                                   </div>
                                   <div style="padding:24px; background:#FFFFF0; border:1px solid #E8E8A0; border-radius:16px;">
                                       <div style="font-size:28px; margin-bottom:8px;">🧈</div>
                                       <div style="font-size:12px; text-transform:uppercase; color:#888; font-weight:600; margin-bottom:4px;">Fats</div>
                                       <div style="font-size:18px; font-weight:700;">${fridgeData.analysis.fats}</div>
                                   </div>
                                   <div style="padding:24px; background:#F0FFF5; border:1px solid #A0E8B0; border-radius:16px;">
                                       <div style="font-size:28px; margin-bottom:8px;">🥦</div>
                                       <div style="font-size:12px; text-transform:uppercase; color:#888; font-weight:600; margin-bottom:4px;">Vegetables</div>
                                       <div style="font-size:18px; font-weight:700;">${fridgeData.analysis.vegetables}</div>
                                   </div>
                                   <div style="padding:24px; background:#F5FBFF; border:1px solid #D8EEFF; border-radius:16px; grid-column:1/-1;">
                                       <div style="font-size:28px; margin-bottom:8px;">💡</div>
                                       <div style="font-size:12px; text-transform:uppercase; color:#888; font-weight:600; margin-bottom:4px;">Tip</div>
                                       <div style="font-size:16px;">${fridgeData.analysis.tip}</div>
                                   </div>
                               </div>
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