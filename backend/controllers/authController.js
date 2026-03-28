const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Signup endpoint
const signup = async (req, res) => {
    console.log('Received signup request with body:', req.body);
    const { firstName, lastName, email, phone, password } = req.body;

    // Check if email exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        console.log('Checked email existence:', err ? err.message : 'No error', 'Results count:', results ? results.length : 0);
        if (err) return res.status(500).json(err);
        if (results.length > 0) return res.status(400).json({ message: 'Email already exists' });

        try {
            console.log('Hashing password...');
            const hashedPassword = await bcrypt.hash(password, 10);
            console.log('Password hashed successfully.');

            const sql = `INSERT INTO users (firstName, lastName, email, phone, password) VALUES (?, ?, ?, ?, ?)`;

            console.log('Executing INSERT query...');
            db.query(sql, [firstName, lastName, email, phone, hashedPassword],
                (err, result) => {
                    console.log('INSERT query finished. Error:', err ? err.message : 'None');
                    if (err) return res.status(500).json(err);
                    res.json({ message: 'Signup successful' });
                });
        } catch (e) {
            console.error('Exception caught in signup callback:', e);
            res.status(500).json({ message: "Server error", error: e.message });
        }
    });
};

// Login endpoint
const login = (req, res) => {
    const { email, password, role } = req.body;
    const requestedRole = role || 'user'; // default to user

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(400).json({ message: 'Invalid email or password' });

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: 'Invalid email or password' });

        // Rely entirely on the user's role from the database
        const dbUserRole = user.role || 'user';

        // Create JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: dbUserRole, firstName: user.firstName }, 
            'secretkey', 
            { expiresIn: '1h' }
        );
        res.json({ token, role: dbUserRole, firstName: user.firstName });
    });
};

module.exports = {
    signup,
    login
};
