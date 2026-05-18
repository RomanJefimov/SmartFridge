const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock Gemini AI
jest.mock('@google/genai', () => ({
    GoogleGenAI: jest.fn().mockImplementation(() => ({
        models: {
            generateContent: jest.fn().mockResolvedValue({
                text: JSON.stringify({
                    products: ['Milk', 'Eggs'],
                    recipes: [{ name: 'Omelette', ingredients: ['Eggs'], steps: ['Cook'] }],
                    analysis: {
                        calories: 'medium',
                        proteins: 'high',
                        carbs: 'low',
                        fats: 'low',
                        vegetables: 'low',
                        tip: 'Eat well'
                    }
                })
            })
        }
    }))
}));

// Mock connectDB so it doesn't connect to the real DB from server.js
jest.mock('../../config/db.js', () => jest.fn());

const app = require('../../server');

// Models are accessed via mongoose.model() — without re-requiring model files
// This prevents OverwriteModelError
function getModel(name) {
    return mongoose.model(name);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function registerUser(email = 'user@test.com', password = 'Password123!@#') {
    const res = await request(app)
        .post('/api/auth/register')
        .send({ email, password });
    return res.body; // { token, email, role }
}

async function loginUser(email, password = 'Password123!@#') {
    const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password });
    return res.body;
}

async function createAdminAndToken() {
    const User = getModel('User');
    const hash = await bcrypt.hash('AdminPass123!@#', 10);
    const admin = await User.create({
        email: `admin_${Date.now()}@test.com`,
        passwordHash: hash,
        role: 'admin'
    });
    const token = jwt.sign(
        { id: admin._id.toString(), email: admin.email, role: 'admin' },
        process.env.JWT_SECRET || 'test_jwt_secret'
    );
    return { admin, token };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
    test('successful registration returns 201 and token', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'new@test.com', password: 'Password123!@#' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.email).toBe('new@test.com');
        expect(res.body.role).toBe('user');
    });

    test('duplicate registration with same email returns 400', async () => {
        await registerUser('dup@test.com');

        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'dup@test.com', password: 'Password123!@#' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Email already in use');
    });

    test('missing password returns 400', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'test@test.com' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Email and password are required');
    });

    test('weak password returns 400', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'test@test.com', password: 'weak' });

        expect(res.status).toBe(400);
    });

    test('invalid email returns 400', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'not-an-email', password: 'Password123!@#' });

        expect(res.status).toBe(400);
    });
});

describe('POST /api/auth/login', () => {
    beforeEach(async () => {
        await registerUser('login@test.com');
    });

    test('successful login returns token', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'login@test.com', password: 'Password123!@#' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.email).toBe('login@test.com');
    });

    test('wrong password returns 400', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'login@test.com', password: 'WrongPass123!@#' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid credentials');
    });

    test('non-existent email returns 400', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nobody@test.com', password: 'Password123!@#' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid credentials');
    });

    test('missing fields returns 400', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ password: 'Password123!@#' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Email and password are required');
    });
});

// ─── Profile ──────────────────────────────────────────────────────────────────

describe('GET /api/profile', () => {
    test('get profile for authenticated user', async () => {
        const { token } = await registerUser('profile@test.com');

        const res = await request(app)
            .get('/api/profile')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('email', 'profile@test.com');
    });

    test('without token returns 401', async () => {
        const res = await request(app).get('/api/profile');
        expect(res.status).toBe(401);
    });
});

describe('PATCH /api/profile', () => {
    test('profile update returns updated data', async () => {
        const { token } = await registerUser('update@test.com');

        const res = await request(app)
            .patch('/api/profile')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Ivan', goal: 'weight_loss', diet: 'none', allergies: [] });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Profile updated');
        expect(res.body.profile.name).toBe('Ivan');
        expect(res.body.profile.goal).toBe('weight_loss');
    });

    test('without token returns 401', async () => {
        const res = await request(app)
            .patch('/api/profile')
            .send({ name: 'Ivan' });

        expect(res.status).toBe(401);
    });
});

// ─── Admin ────────────────────────────────────────────────────────────────────

describe('GET /api/admin/users', () => {
    test('admin gets user list', async () => {
        const { token } = await createAdminAndToken();

        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('users');
        expect(Array.isArray(res.body.users)).toBe(true);
    });

    test('without token returns 401', async () => {
        const res = await request(app).get('/api/admin/users');
        expect(res.status).toBe(401);
    });

    test('regular user gets 403', async () => {
        const { token } = await registerUser('regular@test.com');

        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(403);
    });
});

describe('POST /api/admin/users', () => {
    test('creating new user returns 201', async () => {
        const { token } = await createAdminAndToken();

        const res = await request(app)
            .post('/api/admin/users')
            .set('Authorization', `Bearer ${token}`)
            .send({ email: 'newuser@test.com', password: 'Password123!@#', role: 'user' });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('User created');
        expect(res.body.user.email).toBe('newuser@test.com');
    });

    test('duplicate email returns 400', async () => {
        const { token } = await createAdminAndToken();
        await registerUser('exists@test.com');

        const res = await request(app)
            .post('/api/admin/users')
            .set('Authorization', `Bearer ${token}`)
            .send({ email: 'exists@test.com', password: 'Password123!@#' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Email already in use');
    });

    test('missing email returns 400', async () => {
        const { token } = await createAdminAndToken();

        const res = await request(app)
            .post('/api/admin/users')
            .set('Authorization', `Bearer ${token}`)
            .send({ password: 'Password123!@#' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Email and password are required');
    });
});

describe('PATCH /api/admin/users/:id', () => {
    test('update user role', async () => {
        const { token } = await createAdminAndToken();
        const User = getModel('User');
        const hash = await bcrypt.hash('Pass123!@#', 10);
        const target = await User.create({ email: 'target1@test.com', passwordHash: hash, role: 'user' });

        const res = await request(app)
            .patch(`/api/admin/users/${target._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ role: 'admin' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('User updated');
        expect(res.body.user.role).toBe('admin');
    });

    test('update user password', async () => {
        const { token } = await createAdminAndToken();
        const User = getModel('User');
        const hash = await bcrypt.hash('Pass123!@#', 10);
        const target = await User.create({ email: 'target2@test.com', passwordHash: hash, role: 'user' });

        const res = await request(app)
            .patch(`/api/admin/users/${target._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ password: 'NewPassword123!@#' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('User updated');
    });

    test('admin cannot remove own admin role', async () => {
        const { admin, token } = await createAdminAndToken();

        const res = await request(app)
            .patch(`/api/admin/users/${admin._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ role: 'user' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('You cannot remove your own admin role');
    });

    test('weak password (too short) returns 400', async () => {
        const { token } = await createAdminAndToken();
        const User = getModel('User');
        const hash = await bcrypt.hash('Pass123!@#', 10);
        const target = await User.create({ email: 'target3@test.com', passwordHash: hash, role: 'user' });

        const res = await request(app)
            .patch(`/api/admin/users/${target._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ password: 'weak' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Password must be at least 8 characters');
    });

    test('password without uppercase letter returns 400', async () => {
        const { token } = await createAdminAndToken();
        const User = getModel('User');
        const hash = await bcrypt.hash('Pass123!@#', 10);
        const target = await User.create({ email: 'target4@test.com', passwordHash: hash, role: 'user' });

        const res = await request(app)
            .patch(`/api/admin/users/${target._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ password: 'nouppercase1!' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Password must contain at least one uppercase letter');
    });

    test('non-existent user returns 404', async () => {
        const { token } = await createAdminAndToken();
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .patch(`/api/admin/users/${fakeId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ role: 'user' });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('User not found');
    });
});

describe('DELETE /api/admin/users/:id', () => {
    test('delete existing user', async () => {
        const { token } = await createAdminAndToken();
        const User = getModel('User');
        const hash = await bcrypt.hash('Pass123!@#', 10);
        const target = await User.create({ email: 'todelete@test.com', passwordHash: hash, role: 'user' });

        const res = await request(app)
            .delete(`/api/admin/users/${target._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('User deleted successfully');
    });

    test('admin cannot delete themselves', async () => {
        const { admin, token } = await createAdminAndToken();

        const res = await request(app)
            .delete(`/api/admin/users/${admin._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('You cannot delete yourself');
    });

    test('non-existent user returns 404', async () => {
        const { token } = await createAdminAndToken();
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .delete(`/api/admin/users/${fakeId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('User not found');
    });
});

// ─── Fridge ───────────────────────────────────────────────────────────────────

describe('GET /api/fridge/history', () => {
    test('returns history for authenticated user', async () => {
        const { token } = await registerUser('fridge1@test.com');

        const res = await request(app)
            .get('/api/fridge/history')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('history');
        expect(Array.isArray(res.body.history)).toBe(true);
    });

    test('without token returns 401', async () => {
        const res = await request(app).get('/api/fridge/history');
        expect(res.status).toBe(401);
    });
});

describe('GET /api/fridge/latest', () => {
    test('returns null if no records exist', async () => {
        const { token } = await registerUser('fridge2@test.com');

        const res = await request(app)
            .get('/api/fridge/latest')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('latest');
        expect(res.body.latest).toBeNull();
    });

    test('without token returns 401', async () => {
        const res = await request(app).get('/api/fridge/latest');
        expect(res.status).toBe(401);
    });
});

describe('GET /api/fridge/notifications', () => {
    test('returns empty array if no history', async () => {
        const { token } = await registerUser('notif1@test.com');

        const res = await request(app)
            .get('/api/fridge/notifications')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.notifications).toEqual([]);
    });

    test('returns notification for expired product', async () => {
        const { token } = await registerUser('notif2@test.com');

        // Get userId from token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_jwt_secret');
        const FridgeHistory = getModel('FridgeHistory');

        await FridgeHistory.create({
            userId: decoded.id,
            products: [
                { name: 'OldMilk', expiryDate: new Date('2020-01-01') },
                { name: 'Fresh', expiryDate: new Date('2099-01-01') }
            ]
        });

        const res = await request(app)
            .get('/api/fridge/notifications')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.notifications.length).toBeGreaterThan(0);
        expect(res.body.notifications[0].status).toBe('expired');
    });

    test('without token returns 401', async () => {
        const res = await request(app).get('/api/fridge/notifications');
        expect(res.status).toBe(401);
    });
});

describe('PATCH /api/fridge/products', () => {
    test('update products of existing entry', async () => {
        const { token } = await registerUser('prod1@test.com');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_jwt_secret');
        const FridgeHistory = getModel('FridgeHistory');

        const entry = await FridgeHistory.create({
            userId: decoded.id,
            products: [{ name: 'Milk' }]
        });

        const res = await request(app)
            .patch('/api/fridge/products')
            .set('Authorization', `Bearer ${token}`)
            .send({ id: entry._id.toString(), products: [{ name: 'Eggs' }, { name: 'Bread' }] });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Products updated');
    });

    test('non-existent entry returns 404', async () => {
        const { token } = await registerUser('prod2@test.com');
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .patch('/api/fridge/products')
            .set('Authorization', `Bearer ${token}`)
            .send({ id: fakeId.toString(), products: [{ name: 'Eggs' }] });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Entry not found');
    });

    test('without token returns 401', async () => {
        const res = await request(app)
            .patch('/api/fridge/products')
            .send({ id: 'someid', products: [] });

        expect(res.status).toBe(401);
    });
});