export function showUploadContent(content) {
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

    document.getElementById('fridge-input').addEventListener('change', (e) => handleImageUpload(e, content));
}

async function handleImageUpload(e, content) {
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

export async function analyzeImage(file, status, token, onSuccess) {
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

        onSuccess(data);

    } catch (err) {
        status.style.color = 'red';
        status.textContent = '✗ Failed to analyze image';
        console.error(err);
    }
}

export function showProducts(content, fridgeData, token, editMode = false) {
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
                showProducts(content, fridgeData, token, true);
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
                    showProducts(content, fridgeData, token, false);
                    document.getElementById('update-recipes-wrap').innerHTML = `
                        <button class="btn" id="update-recipes-btn">🔄 Update recipes based on new products</button>
                    `;
                    document.getElementById('update-recipes-btn').addEventListener('click', () => updateRecipes(fridgeData, token));
                }
            } catch (err) {
                console.error(err);
            }
        });
    } else {
        document.getElementById('edit-btn').addEventListener('click', () => showProducts(content, fridgeData, token, true));
    }
}

export async function updateRecipes(fridgeData, token) {
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