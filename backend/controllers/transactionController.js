const db = require('../config/db');

// View specific user transactions (Admin only)
const getUserTransactionsAdmin = (req, res) => {
    const targetUserId = req.params.id;

    // Use INNER JOIN to only fetch transactions that have a valid existing car
    const sql = `
        SELECT t.*, CONCAT(c.make, ' ', c.model) as carName 
        FROM transactions t 
        INNER JOIN cars c ON t.carId = c.id
        WHERE t.userId = ? 
        ORDER BY t.createdAt DESC
    `;

    db.query(sql, [targetUserId], (txErr, txResults) => {
        if (txErr) return res.status(500).json({ message: 'Error fetching transactions', error: txErr.message });
        res.json(txResults);
    });
};

// View all transactions (Admin only)
const getAllTransactions = (req, res) => {
    const sql = `
        SELECT t.*, CONCAT(c.make, ' ', c.model) as carName, u.firstName, u.lastName
        FROM transactions t 
        LEFT JOIN cars c ON t.carId = c.id
        LEFT JOIN users u ON t.userId = u.id
        ORDER BY t.createdAt DESC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching global transactions', error: err.message });
        res.json(results);
    });
};

// Payment & Reservation endpoint
const processPayment = (req, res) => {
    const { paymentMethod, amount, carId, pickupDate, returnDate, notes } = req.body;
    const userId = req.user.id; // from jwt

    if (!paymentMethod || !amount) {
        return res.status(400).json({ message: 'Payment method and amount are required' });
    }

    const isReservation = paymentMethod === 'cash_reservation' || paymentMethod.includes('deposit') || paymentMethod === 'card' || paymentMethod === 'paypal';
    const status = isReservation ? 'reserved' : 'completed';

    // 1. Check for overlapping reservations if it's a car rental
    if (carId && isReservation && pickupDate && returnDate) {
        const checkSql = `
            SELECT COUNT(*) AS count FROM transactions 
            WHERE carId = ? AND status = 'reserved'
            AND (
                (pickupDate BETWEEN ? AND ?) OR 
                (returnDate BETWEEN ? AND ?) OR
                (? BETWEEN pickupDate AND returnDate)
            )
        `;
        
        db.query(checkSql, [carId, pickupDate, returnDate, pickupDate, returnDate, pickupDate], (err, results) => {
            if (err) return res.status(500).json({ message: 'Error checking availability', error: err.message });
            
            if (results[0].count > 0) {
                return res.status(400).json({ message: 'This vehicle is already reserved for the selected dates. Please choose another vehicle or different dates.' });
            }

            // Proceed to insert if no conflict
            commitTransaction();
        });
    } else {
        commitTransaction();
    }

    function commitTransaction() {
        const sql = `INSERT INTO transactions (userId, carId, paymentMethod, amount, status, pickupDate, returnDate, notes) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(sql, [userId, carId || null, paymentMethod, amount, status, pickupDate || null, returnDate || null, notes || null], (err, result) => {
            if (err) {
                console.error('Payment commit error:', err);
                return res.status(500).json({ message: 'Transaction failed', error: err.message });
            }
            res.json({
                message: isReservation ? 'Reservation successful' : 'Payment successful',
                transactionId: result.insertId
            });
        });
    }
};

module.exports = {
    getUserTransactionsAdmin,
    getAllTransactions,
    processPayment
};
