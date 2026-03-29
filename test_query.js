const mysql = require('mysql2/promise');

async function testQuery() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '1BrickBrick1$',
        database: 'car_rental'
    });

    console.log('Connected to MySQL.');

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

    const [results] = await db.query(sql);
    console.log('Results length:', results.length);
    if (results.length > 0) {
        console.log('First record:', results[0]);
    }

    await db.end();
}

testQuery().catch(err => console.error(err));
