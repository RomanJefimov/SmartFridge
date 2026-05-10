export function showRecipes(content, fridgeData) {
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
            document.getElementById('prev-btn').addEventListener('click', () => { current--; render(); });
        }
        if (current < recipes.length - 1) {
            document.getElementById('next-btn').addEventListener('click', () => { current++; render(); });
        }
    }

    render();
}

export function renderRecipeSlide(recipes, current) {
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

export function attachRecipeSlider(recipes, current) {
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