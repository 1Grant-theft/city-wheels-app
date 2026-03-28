const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// Admin routes for viewing transactions
router.get('/api/admin/transactions', authenticateToken, isAdmin, transactionController.getAllTransactions);
router.get('/api/admin/users/:id/transactions', authenticateToken, isAdmin, transactionController.getUserTransactionsAdmin);

// Process a payment/reservation
router.post('/payment', authenticateToken, transactionController.processPayment);

module.exports = router;
