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

db.query(`ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'`, () => {});

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

db.query(createTransactionsTable, (err) => {
    if (err) console.error('Database Warning:', err.message);
    else console.log('Database pool ready');
});

module.exports = db;
