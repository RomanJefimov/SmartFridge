import { renderRecipeSlide, attachRecipeSlider } from './recipes.js';

export async function showHistory(content, token) {
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
                                                        <div style="padding:8px 12px; background:#F5FBFF; border:1px solid #D8EEFF; border-radius:10px; font-size:14px;">${p}</div>
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