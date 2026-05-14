export function showUploadContent(content, token, onSuccess) {
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

    document
        .getElementById('fridge-input')
        .addEventListener('change', (e) =>
            handleImageUpload(e, token, onSuccess)
        );
}

async function handleImageUpload(e, token, onSuccess) {
    const file = e.target.files[0];
    if (!file) return;

    const preview = document.getElementById('preview-wrap');
    const status = document.getElementById('analyze-status');

    const url = URL.createObjectURL(file);

    preview.innerHTML = `
        <img src="${url}" style="max-width:320px; border-radius:12px; margin-bottom:16px; display:block;">
        <button class="btn" id="analyze-btn">Analyze with AI</button>
    `;

    document
        .getElementById('analyze-btn')
        .addEventListener('click', () =>
            analyzeImage(file, status, token, onSuccess)
        );
}

export async function analyzeImage(file, status, token, onSuccess) {
    status.textContent = '🔍 Analyzing your fridge...';

    const formData = new FormData();
    formData.append('image', file);

    try {
        const res = await fetch('/api/fridge/analyze', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        const data = await res.json();

        if (!res.ok) {
            status.textContent =
                '✗ ' + (data.message || 'Error');
            return;
        }

        onSuccess(data);
    } catch (err) {
        status.style.color = 'red';
        status.textContent =
            '✗ Failed to analyze image';
        console.error(err);
    }
}

export function showProducts(content, fridgeData, token, editMode = false, tempProducts = null) {
    const raw = tempProducts || fridgeData.products || [];
    const products = raw.map(p =>
        typeof p === 'string' ? { name: p, expiryDate: null } : { ...p }
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    function getExpiryStatus(expiryDate) {
        if (!expiryDate) return null;
        const exp = new Date(expiryDate);
        exp.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 'expired';
        if (diffDays <= 1) return 'expiring';
        return 'ok';
    }

    function cardStyle(status) {
        if (status === 'expired')  return 'background:#FFF0F0; border:1px solid #FFB0B0;';
        if (status === 'expiring') return 'background:#FFFBF0; border:1px solid #FFE08A;';
        return 'background:#F5FBFF; border:1px solid #D8EEFF;';
    }

    content.innerHTML = `
        <div style="width:100%; padding:32px; box-sizing:border-box;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
                <h1 style="font-size:32px; font-weight:700; margin:0;">List of products</h1>
                <div style="display:flex; gap:12px; align-items:center;">
                    ${!editMode ? `<button class="btn" id="update-recipes-btn">🔄 Update recipes</button>` : ''}
                    ${editMode
                        ? `<button class="btn" id="save-btn">Save</button>`
                        : `<button class="btn" id="edit-btn">Edit</button>`}
                </div>
            </div>

            <div id="products-grid" style="
                display:grid;
                grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));
                gap:12px;
            ">
                ${products.map((p, i) => {
                    const status = getExpiryStatus(p.expiryDate);
                    const expFormatted = p.expiryDate
                        ? new Date(p.expiryDate).toISOString().split('T')[0]
                        : '';
                    const badge = status === 'expired'
                        ? `<span style="font-size:11px; color:#ff4646; font-weight:600;">Expired</span>`
                        : status === 'expiring'
                        ? `<span style="font-size:11px; color:#e6a817; font-weight:600;">Expires soon</span>`
                        : '';

                    return `
                    <div style="
                        display:flex;
                        flex-direction:column;
                        gap:6px;
                        padding:12px 16px;
                        ${cardStyle(status)}
                        border-radius:12px;
                        font-size:15px;
                    ">
                        <div style="display:flex; align-items:center; justify-content:space-between;">
                            <span style="font-weight:600;">${p.name}</span>
                            ${editMode ? `
                                <button data-index="${i}" class="remove-btn" style="
                                    background:none; border:none; color:#ff4646;
                                    cursor:pointer; font-size:16px; padding:0; line-height:1;
                                ">✕</button>` : ''}
                        </div>
                        ${editMode ? `
                            <input
                                type="date"
                                data-index="${i}"
                                class="expiry-input"
                                value="${expFormatted}"
                                style="
                                    font-size:13px;
                                    border:1px solid #cce4ff;
                                    border-radius:8px;
                                    padding:4px 8px;
                                    color:#555;
                                    width:100%;
                                    box-sizing:border-box;
                                "
                            >
                        ` : `
                            <span style="font-size:12px; color:#888;">
                                ${p.expiryDate ? '📅 ' + new Date(p.expiryDate).toLocaleDateString() : '<span style="color:#bbb;">No expiry set</span>'}
                            </span>
                            ${badge}
                        `}
                    </div>`;
                }).join('')}
            </div>
        </div>
    `;

    if (editMode) {
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const updated = [...products];
                updated.splice(Number(btn.dataset.index), 1);
                showProducts(content, fridgeData, token, true, updated);
            });
        });

        document.getElementById('save-btn').addEventListener('click', async () => {
            const updatedProducts = products.map((p, i) => {
                const input = document.querySelector(`.expiry-input[data-index="${i}"]`);
                return {
                    name: p.name,
                    expiryDate: input && input.value ? input.value : null
                };
            });

            try {
                const res = await fetch('/api/fridge/products', {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id: fridgeData._id, products: updatedProducts })
                });

                if (res.ok) {
                    fridgeData.products = updatedProducts;
                    showProducts(content, fridgeData, token, false);
                }
            } catch (err) {
                console.error(err);
            }
        });

    } else {
        document.getElementById('edit-btn').addEventListener('click', () => {
            showProducts(content, fridgeData, token, true, [...fridgeData.products]);
        });

        const updateBtn = document.getElementById('update-recipes-btn');
        if (updateBtn) {
            updateBtn.addEventListener('click', () => updateRecipes(fridgeData, token));
        }
    }
}

export async function updateRecipes(
    fridgeData,
    token
) {
    const updateBtn =
        document.getElementById(
            'update-recipes-btn'
        );

    if (updateBtn) {
        updateBtn.disabled = true;
        updateBtn.textContent =
            '🔍 Updating recipes...';
    }

    try {
        const res = await fetch(
            '/api/fridge/recipes',
            {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type':
                        'application/json'
                },
                body: JSON.stringify({
                    id: fridgeData._id,
                    products:
                        fridgeData.products
                })
            }
        );

        const data = await res.json();

        if (res.ok) {
            fridgeData.recipes =
                data.recipes;

            if (updateBtn) {
                updateBtn.textContent =
                    '✓ Recipes updated';
            }
        } else {
            if (updateBtn) {
                updateBtn.textContent =
                    '✗ Failed';
                updateBtn.disabled =
                    false;
            }
        }
    } catch (err) {
        console.error(err);

        if (updateBtn) {
            updateBtn.textContent =
                '✗ Error';
            updateBtn.disabled =
                false;
        }
    }
}