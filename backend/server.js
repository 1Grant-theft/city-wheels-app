const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const app = express();

// Deployment Security Headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

app.use(bodyParser.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Newsletter subscription endpoint
app.post('/api/newsletter', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    console.log(`[Newsletter] New subscriber: ${email}`);
    res.json({ message: 'Success! You have been subscribed to our newsletter.' });
});

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // your MySQL username
    password: '1BrickBrick1$', // your MySQL password
    database: 'car_rental' // database name
});

db.connect(err => {
    if (err) throw err;
    console.log('MySQL connected');

    // Ensure users table has a role column
    db.query(`ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'`, (err) => {
        // Ignore duplicate column errors
    });

    // Use existing cars table schema
    // Table: id, make, model, year, price_per_day, image_url, available, category, transmission, seats
    // We don't need to create it since it already exists.

    // Ensure transactions table exists
    const createTransactionsTable = `
        CREATE TABLE IF NOT EXISTS transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT NOT NULL,
            carId INT,
            paymentMethod VARCHAR(50) NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            pickupDate DATE NULL,
            returnDate DATE NULL,
            notes TEXT NULL,
            status VARCHAR(20) DEFAULT 'completed',
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )
    `;
    db.query(createTransactionsTable, (tableErr) => {
        if (tableErr) console.error('Error creating transactions table:', tableErr);
        else console.log('Transactions table ready');
    });
});

// Signup endpoint
app.post('/signup', async (req, res) => {
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

            const sql = `INSERT INTO users (firstName, lastName, email, phone, password)
VALUES (?, ?, ?, ?, ?)`;

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
});

// Login endpoint
app.post('/login', (req, res) => {
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
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access Denied' });

    jwt.verify(token, 'secretkey', (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid Token' });
        req.user = user;
        next();
    });
};

// Admin Middleware
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Admin Access Required' });
    }
};

// --- New API Endpoints ---

// Get all users (Admin only)
app.get('/api/users', authenticateToken, isAdmin, (req, res) => {
    db.query('SELECT id, firstName, lastName, email, phone, role, createdAt FROM users', (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching users', error: err.message });
        res.json(results);
    });
});

// Delete user (Admin only)
app.delete('/api/users/:id', authenticateToken, isAdmin, (req, res) => {
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
});

// View specific user transactions (Admin only)
app.get('/api/admin/users/:id/transactions', authenticateToken, isAdmin, (req, res) => {
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
});

// View all transactions (Admin only)
app.get('/api/admin/transactions', authenticateToken, isAdmin, (req, res) => {
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
});

// Add a new car (Admin only)
app.post('/api/cars', authenticateToken, isAdmin, upload.single('image'), (req, res) => {
    const { make, model, year, price_per_day, category, transmission, seats } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const available = 1;

    if (!make || !model || !price_per_day) {
        return res.status(400).json({ message: 'Make, model, and price_per_day are required' });
    }

    const sql = `INSERT INTO cars (make, model, year, price_per_day, image_url, available, category, transmission, seats) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(sql, [make, model, year || 2023, price_per_day, image_url, available, category || 'Sedan', transmission || 'Automatic', seats || 5], (err, result) => {
        if (err) return res.status(500).json({ message: 'Failed to add car', error: err.message });
        res.json({ message: 'Car added successfully', id: result.insertId });
    });
});

// Edit a car (Admin only)
app.put('/api/cars/:id', authenticateToken, isAdmin, (req, res) => {
    const carId = req.params.id;
    const { make, model, year, price_per_day, category, transmission, seats } = req.body;

    if (!make || !model || price_per_day === undefined) {
        return res.status(400).json({ message: 'Make, model, and price_per_day are required' });
    }

    const sql = `
        UPDATE cars 
        SET make = ?, model = ?, year = ?, price_per_day = ?, category = ?, transmission = ?, seats = ?
        WHERE id = ?
    `;

    db.query(sql, [make, model, year, price_per_day, category, transmission, seats, carId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Failed to update car details', error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Car not found' });
        res.json({ message: 'Car updated successfully' });
    });
});

// Get all cars (Public)
app.get('/api/cars', (req, res) => {
    const sql = `
        SELECT c.*, 
               (SELECT returnDate FROM transactions 
                WHERE carId = c.id AND status = 'reserved' 
                AND returnDate >= CURDATE() 
                ORDER BY returnDate DESC LIMIT 1) as reservedUntil,
               (SELECT COUNT(*) FROM transactions 
                WHERE carId = c.id AND status = 'reserved' 
                AND CURDATE() BETWEEN pickupDate AND returnDate) as isCurrentlyReserved
        FROM cars c 
        ORDER BY id DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching cars', error: err.message });
        res.json(results);
    });
});

// ------------------------

// Contact form endpoint
app.post('/api/contact', (req, res) => {
    const { name, email, phone, reason, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    // In a real app, this would send an email. For now, we'll log it and return success.
    console.log(`[Contact Form] From: ${name} (${email}) - Reason: ${reason}`);
    console.log(`Message: ${message}`);

    res.json({ message: 'Your message has been sent successfully! We will get back to you soon.' });
});

// Payment & Reservation endpoint
app.post('/payment', authenticateToken, (req, res) => {
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
});

// User Profile & Transactions endpoint
app.get('/user-transactions', authenticateToken, (req, res) => {
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
});

// Clear User History Endpoint
app.delete('/user-transactions/history', authenticateToken, (req, res) => {
    const userId = req.user.id;

    // Delete everything except active reservations
    db.query(`DELETE FROM transactions WHERE userId = ? AND status != 'reserved'`, [userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error clearing history', error: err.message });
        res.json({ message: 'History cleared successfully', deletedCount: result.affectedRows });
    });
});

app.listen(3000, () => console.log('Server running on port 3000'));