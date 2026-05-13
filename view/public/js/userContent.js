import { showAdminPanel, loadUsers } from './modules/admin.js';
import { showUploadContent, showProducts } from './modules/fridge.js';
import { showRecipes } from './modules/recipes.js';
import { showHistory } from './modules/history.js';
import { showProfile } from './modules/profile.js';

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
            if (data.latest) fridgeData = data.latest;
        } catch (err) {
            console.error(err);
        }
    }

    loadLatest();

    const adminPanel = document.querySelector('.admin-panel');
    if (role === 'admin') adminPanel.style.display = 'flex';

    function setActive(element) {
        menuItems.forEach(item => item.classList.remove("active"));
        element.classList.add("active");
        localStorage.setItem('activeSection', element.textContent.trim());
    }

    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            setActive(item);
            const text = item.textContent.trim();

            switch (text) {
                case "Upload Picture":
                    showUploadContent(content, token, (data) => {
                        fridgeData = data;
                        const productsItem = [...menuItems].find(i => i.textContent.trim() === 'List of products');
                        if (productsItem) { setActive(productsItem); productsItem.click(); }
                    });
                    break;

                case "List of products":
                    if (fridgeData) {
                        showProducts(content, fridgeData, token);
                    } else {
                        content.innerHTML = `<div style="padding:32px;"><h1>List of products</h1><p>Upload a fridge photo first.</p></div>`;
                    }
                    break;

                case "Recipes":
                    if (fridgeData) {
                        showRecipes(content, fridgeData);
                    } else {
                        content.innerHTML = `<div style="padding:32px;"><h1>Recipes</h1><p>Upload a fridge photo first.</p></div>`;
                    }
                    break;

                case "History":
                    showHistory(content, token);
                    break;

                case "Personal characteristics":
                    showProfile(content, token);
                    break;

                case "Analysis":
                    if (fridgeData) {
                        content.innerHTML = `
                            <div style="width:100%; padding:32px; box-sizing:border-box;">
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
                            </div>
                        `;
                    } else {
                        content.innerHTML = `<div style="padding:32px;"><h1>Analysis</h1><p>Upload a fridge photo first.</p></div>`;
                    }
                    break;

                case "Admin panel":
                    showAdminPanel(content, () => loadUsers(token, email));
                    break;
            }
        });
    });

    const savedSection = localStorage.getItem('activeSection') || 'Upload Picture';
    const defaultItem = [...menuItems].find(i => i.textContent.trim() === savedSection);
    if (defaultItem) { setActive(defaultItem); defaultItem.click(); }

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