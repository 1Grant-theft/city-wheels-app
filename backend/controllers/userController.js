const db = require('../config/db');

// Get all users (Admin only)
const getAllUsers = (req, res) => {
    db.query('SELECT id, firstName, lastName, email, phone, role, createdAt FROM users', (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching users', error: err.message });
        res.json(results);
    });
};

// Delete user (Admin only)
const deleteUser = (req, res) => {
    const targetUserId = req.params.id;

    // Optional safety: Prevent deleting yourself
    if (parseInt(targetUserId) === req.user.id) {
        return res.status(400).json({ message: 'You cannot delete your own admin account.' });
    }

    db.query('DELETE FROM users WHERE id = ?', [targetUserId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error deleting user', error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    });
};

// User Profile & Transactions endpoint
const getUserTransactions = (req, res) => {
    const userId = req.user.id;

    // First fetch user data (safely exclude password)
    db.query('SELECT id, firstName, lastName, email, phone, createdAt FROM users WHERE id = ?', [userId], (err, userResults) => {
        if (err) return res.status(500).json({ message: 'Error fetching user data', error: err.message });
        if (userResults.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = userResults[0];

        // Use INNER JOIN against cars table.
        // If the car was deleted from DB (e.g. wiped generic cars), the transaction is orphaned and won't be returned.
        const sql = `
            SELECT t.*, CONCAT(c.make, ' ', c.model) as carName 
            FROM transactions t 
            INNER JOIN cars c ON t.carId = c.id
            WHERE t.userId = ? 
            ORDER BY t.createdAt DESC
        `;

        db.query(sql, [userId], (txErr, txResults) => {
            if (txErr) return res.status(500).json({ message: 'Error fetching transactions', error: txErr.message });

            res.json({
                user: user,
                transactions: txResults
            });
        });
    });
};

// Clear User History Endpoint
const clearUserHistory = (req, res) => {
    const userId = req.user.id;

    // Delete everything except active reservations
    db.query(`DELETE FROM transactions WHERE userId = ? AND status != 'reserved'`, [userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error clearing history', error: err.message });
        res.json({ message: 'History cleared successfully', deletedCount: result.affectedRows });
    });
};

module.exports = {
    getAllUsers,
    deleteUser,
    getUserTransactions,
    clearUserHistory
};
