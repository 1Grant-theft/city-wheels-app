const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function seed() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '1BrickBrick1$',
        database: 'car_rental'
    });

    console.log('Connected to MySQL.');

    // 1. Insert an Admin user
    const adminEmail = 'admin@admin.com';
    const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
    if (rows.length === 0) {
        const hashedPassword = await bcrypt.hash('admin', 10);
        await db.query(`
            INSERT INTO users (firstName, lastName, email, phone, password, role)
            VALUES ('Admin', 'User', ?, '1234567890', ?, 'admin')
        `, [adminEmail, hashedPassword]);
        console.log('Created Admin user: admin@admin.com / password: admin');
    } else {
        console.log('Admin user already exists.');
    }

    // 2. Insert some mock cars if table is empty
    const [cars] = await db.query('SELECT count(*) as count FROM cars');
    if (cars[0].count === 0) {
        const sampleCars = [
            ['Tesla', 'Model S', 2023, 150.00, '', 1, 'Electric', 'Automatic', 5],
            ['BMW', '3 Series', 2022, 120.00, '', 1, 'Sedan', 'Automatic', 5],
            ['Audi', 'Q7', 2023, 180.00, '', 1, 'SUV', 'Automatic', 7],
            ['Toyota', 'Camry', 2021, 60.00, '', 1, 'Sedan', 'Automatic', 5],
            ['Ford', 'Mustang', 2022, 130.00, '', 1, 'Coupe', 'Manual', 4]
        ];

        for (const car of sampleCars) {
            await db.query(`
                INSERT INTO cars (make, model, year, price_per_day, image_url, available, category, transmission, seats)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, car);
        }
        console.log('Inserted 5 sample cars.');
    } else {
        console.log('Cars table already has records.');
    }

    await db.end();
    console.log('Done mapping.');
}

seed().catch(err => console.error(err));
