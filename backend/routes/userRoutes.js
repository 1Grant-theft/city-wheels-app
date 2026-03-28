const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// Admin only routes for managing users
router.get('/api/users', authenticateToken, isAdmin, userController.getAllUsers);
router.delete('/api/users/:id', authenticateToken, isAdmin, userController.deleteUser);

// Authenticated user routes
router.get('/user-transactions', authenticateToken, userController.getUserTransactions);
router.delete('/user-transactions/history', authenticateToken, userController.clearUserHistory);

module.exports = router;
