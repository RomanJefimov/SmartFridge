export async function showProfile(content, token) {
    content.innerHTML = `<div style="width:100%; padding:32px; box-sizing:border-box;"><h1 style="font-size:32px; font-weight:700; margin-bottom:24px;">Personal characteristics</h1><p>Loading...</p></div>`;

    try {
        const res = await fetch('/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const p = data.profile || {};

        content.innerHTML = `
            <div style="width:100%; padding:32px; box-sizing:border-box;">
                <h1 style="font-size:32px; font-weight:700; margin-bottom:8px;">Personal characteristics</h1>
                <p style="color:#888; margin-bottom:32px;">This information helps AI generate better recipes for you</p>

                <div style="max-width:560px; display:flex; flex-direction:column; gap:20px;">

                    <div>
                        <label style="font-size:13px; text-transform:uppercase; color:#888; font-weight:600; display:block; margin-bottom:8px;">Name</label>
                        <input id="profile-name" type="text" value="${p.name || ''}" placeholder="Your name" style="
                            width:100%; padding:10px 14px; border:1px solid #D8EEFF;
                            border-radius:10px; font-family:Manrope,sans-serif; font-size:15px; box-sizing:border-box;
                        ">
                    </div>

                    <div>
                        <label style="font-size:13px; text-transform:uppercase; color:#888; font-weight:600; display:block; margin-bottom:8px;">Nutrition goal</label>
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            ${[
                                { value: 'weight_loss', label: '⚖️ Weight loss' },
                                { value: 'muscle_gain', label: '💪 Muscle gain' },
                                { value: 'healthy_eating', label: '🥗 Healthy eating' }
                            ].map(opt => `
                                <button class="goal-btn" data-value="${opt.value}" style="
                                    padding:8px 16px; border-radius:20px; cursor:pointer; font-family:Manrope,sans-serif; font-size:14px;
                                    border:1px solid ${p.goal === opt.value ? '#009FE3' : '#D8EEFF'};
                                    background:${p.goal === opt.value ? '#009FE3' : 'transparent'};
                                    color:${p.goal === opt.value ? '#fff' : '#333'};
                                ">${opt.label}</button>
                            `).join('')}
                        </div>
                    </div>

                    <div>
                        <label style="font-size:13px; text-transform:uppercase; color:#888; font-weight:600; display:block; margin-bottom:8px;">Diet type</label>
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            ${[
                                { value: 'none', label: '🍽️ No restrictions' },
                                { value: 'vegetarian', label: '🥦 Vegetarian' },
                                { value: 'vegan', label: '🌱 Vegan' }
                            ].map(opt => `
                                <button class="diet-btn" data-value="${opt.value}" style="
                                    padding:8px 16px; border-radius:20px; cursor:pointer; font-family:Manrope,sans-serif; font-size:14px;
                                    border:1px solid ${(p.diet || 'none') === opt.value ? '#009FE3' : '#D8EEFF'};
                                    background:${(p.diet || 'none') === opt.value ? '#009FE3' : 'transparent'};
                                    color:${(p.diet || 'none') === opt.value ? '#fff' : '#333'};
                                ">${opt.label}</button>
                            `).join('')}
                        </div>
                    </div>

                    <div>
                        <label style="font-size:13px; text-transform:uppercase; color:#888; font-weight:600; display:block; margin-bottom:8px;">Allergies</label>
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            ${['Milk', 'Gluten', 'Nuts', 'Eggs', 'Seafood', 'Soy'].map(allergy => `
                                <button class="allergy-btn" data-value="${allergy}" style="
                                    padding:8px 16px; border-radius:20px; cursor:pointer; font-family:Manrope,sans-serif; font-size:14px;
                                    border:1px solid ${(p.allergies || []).includes(allergy) ? '#ff4646' : '#D8EEFF'};
                                    background:${(p.allergies || []).includes(allergy) ? 'rgba(255,70,70,0.1)' : 'transparent'};
                                    color:${(p.allergies || []).includes(allergy) ? '#ff4646' : '#333'};
                                ">${allergy}</button>
                            `).join('')}
                        </div>
                    </div>

                    <div style="display:flex; align-items:center; gap:12px; margin-top:8px;">
                        <button id="save-profile-btn" class="btn">Save</button>
                        <span id="profile-status" style="font-size:14px;"></span>
                    </div>

                </div>
            </div>
        `;

        let selectedGoal = p.goal || '';
        let selectedDiet = p.diet || 'none';
        let selectedAllergies = [...(p.allergies || [])];

        document.querySelectorAll('.goal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedGoal = btn.dataset.value;
                document.querySelectorAll('.goal-btn').forEach(b => {
                    b.style.background = 'transparent';
                    b.style.color = '#333';
                    b.style.borderColor = '#D8EEFF';
                });
                btn.style.background = '#009FE3';
                btn.style.color = '#fff';
                btn.style.borderColor = '#009FE3';
            });
        });

        document.querySelectorAll('.diet-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedDiet = btn.dataset.value;
                document.querySelectorAll('.diet-btn').forEach(b => {
                    b.style.background = 'transparent';
                    b.style.color = '#333';
                    b.style.borderColor = '#D8EEFF';
                });
                btn.style.background = '#009FE3';
                btn.style.color = '#fff';
                btn.style.borderColor = '#009FE3';
            });
        });

        document.querySelectorAll('.allergy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const val = btn.dataset.value;
                if (selectedAllergies.includes(val)) {
                    selectedAllergies = selectedAllergies.filter(a => a !== val);
                    btn.style.background = 'transparent';
                    btn.style.color = '#333';
                    btn.style.borderColor = '#D8EEFF';
                } else {
                    selectedAllergies.push(val);
                    btn.style.background = 'rgba(255,70,70,0.1)';
                    btn.style.color = '#ff4646';
                    btn.style.borderColor = '#ff4646';
                }
            });
        });

        document.getElementById('save-profile-btn').addEventListener('click', async () => {
            const status = document.getElementById('profile-status');
            const name = document.getElementById('profile-name').value.trim();

            try {
                const res = await fetch('/api/profile', {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name,
                        goal: selectedGoal,
                        diet: selectedDiet,
                        allergies: selectedAllergies
                    })
                });

                if (res.ok) {
                    status.style.color = 'green';
                    status.textContent = '✓ Saved';
                } else {
                    status.style.color = 'red';
                    status.textContent = '✗ Error saving';
                }
            } catch (err) {
                status.style.color = 'red';
                status.textContent = '✗ Server error';
                console.error(err);
            }
        });

    } catch (err) {
        content.innerHTML = `<div style="padding:32px;"><h1>Personal characteristics</h1><p style="color:red;">Failed to load profile.</p></div>`;
        console.error(err);
    }
}