const mysql = require('mysql2');

const getEnv = (key, defaultVal) => {
    let val = process.env[key];
    if (val && typeof val === 'string') {
        val = val.replace(/^["']|["']$/g, '');
        return val;
    }
    return defaultVal;
};

let poolConfig;
const mysqlUrl = getEnv('MYSQL_URL', null);

if (mysqlUrl && mysqlUrl.startsWith('mysql://')) {
    poolConfig = mysqlUrl;
} else {
    poolConfig = {
        host: getEnv('MYSQLHOST', getEnv('DB_HOST', 'localhost')),
        user: getEnv('MYSQLUSER', getEnv('DB_USER', 'root')), 
        password: getEnv('MYSQLPASSWORD', getEnv('DB_PASSWORD', '1BrickBrick1$')), 
        database: getEnv('MYSQLDATABASE', getEnv('DB_NAME', 'car_rental')),
        port: getEnv('MYSQLPORT', getEnv('DB_PORT', 3306)),
        waitForConnections: true, 
        connectionLimit: 10, 
        queueLimit: 0
    };
}

const db = mysql.createPool(poolConfig);

// Initialize DB Tables
const initDB = async () => {
    try {
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                firstName VARCHAR(50) NOT NULL,
                lastName VARCHAR(50) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(20),
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const createCarsTable = `
            CREATE TABLE IF NOT EXISTS cars (
                id INT AUTO_INCREMENT PRIMARY KEY,
                make VARCHAR(50) NOT NULL,
                model VARCHAR(50) NOT NULL,
                year INT DEFAULT 2023,
                price_per_day DECIMAL(10, 2) NOT NULL,
                image_url VARCHAR(255),
                available TINYINT(1) DEFAULT 1,
                category VARCHAR(50) DEFAULT 'Sedan',
                transmission VARCHAR(50) DEFAULT 'Automatic',
                seats INT DEFAULT 5,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

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

        await db.promise().query(createUsersTable);
        await db.promise().query(createCarsTable);
        await db.promise().query(createTransactionsTable);
        
        console.log('Database tables initialized successfully');
    } catch (err) {
        console.error('Database Initialization Warning:', err.message);
    }
};

initDB();

module.exports = db;
