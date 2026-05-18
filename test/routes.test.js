const express = require('express');
const adminRoutes = require('../route/adminRoutes');
const authRoutes = require('../route/authRoutes');
const fridgeRoutes = require('../route/fridgeRoutes');
const profileRoutes = require('../route/profileRoutes');
const viewRoutes = require('../route/viewRoutes');

describe('Routes', () => {
    test('adminRoutes should be defined', () => {
        expect(adminRoutes).toBeDefined();
    });
    test('authRoutes should be defined', () => {
        expect(authRoutes).toBeDefined();
    });
    test('fridgeRoutes should be defined', () => {
        expect(fridgeRoutes).toBeDefined();
    });
    test('profileRoutes should be defined', () => {
        expect(profileRoutes).toBeDefined();
    });
    test('viewRoutes should be defined', () => {
        expect(viewRoutes).toBeDefined();
    });
});
