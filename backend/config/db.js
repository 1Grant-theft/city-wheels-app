const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || '1BrickBrick1$', 
    database: process.env.DB_NAME || 'car_rental',
    port: process.env.DB_PORT || 3306
});

db.connect(err => {
    if (err) throw err;
    console.log('MySQL connected');

    // Ensure users table has a role column
    db.query(`ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'`, (err) => {
        // Ignore duplicate column errors
    });

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

module.exports = db;
