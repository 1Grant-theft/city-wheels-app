const bcrypt = require('bcrypt');
const db = require('../config/db');

// Newsletter subscription endpoint
const subscribeNewsletter = (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    console.log(`[Newsletter] New subscriber: ${email}`);
    res.json({ message: 'Success! You have been subscribed to our newsletter.' });
};

// Contact form endpoint
const submitContactForm = (req, res) => {
    const { name, email, phone, reason, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    // In a real app, this would send an email. For now, we'll log it and return success.
    console.log(`[Contact Form] From: ${name} (${email}) - Reason: ${reason}`);
    console.log(`Message: ${message}`);

    res.json({ message: 'Your message has been sent successfully! We will get back to you soon.' });
};

// Database seeding endpoint (Internal use for production initialization)
const seedDatabase = async (req, res) => {
    try {
        console.log('Seeding Database...');

        // 1. Insert an Admin user
        const adminEmail = 'admin@admin.com';
        const [rows] = await db.promise().query('SELECT id FROM users WHERE email = ?', [adminEmail]);
        if (rows.length === 0) {
            const hashedPassword = await bcrypt.hash('admin', 10);
            await db.promise().query(`
                INSERT INTO users (firstName, lastName, email, phone, password, role)
                VALUES ('Admin', 'User', ?, '1234567890', ?, 'admin')
            `, [adminEmail, hashedPassword]);
            console.log('Created Admin user: admin@admin.com / password: admin');
        } else {
            console.log('Admin user already exists.');
        }

        // 2. Insert user cars
        const [cars] = await db.promise().query('SELECT count(*) as count FROM cars');
        if (cars[0].count === 0) {
            const userCars = [
                ['Mercedes-Benz', 'GLE', 2022, 250.00, 'assets/cars/benz.gle.webp', 1, 'SUV', 'Automatic', 5],
                ['BMW', '320i', 2021, 150.00, 'assets/cars/bmw.320i.jpg', 1, 'Sedan', 'Automatic', 5],
                ['BMW', 'X6', 2022, 220.00, 'assets/cars/bmw.x6.jpg', 1, 'SUV', 'Automatic', 5],
                ['Honda', 'Accord', 2020, 110.00, 'assets/cars/honda.accord.jpg', 1, 'Sedan', 'Automatic', 5],
                ['Honda', 'Fit', 2019, 70.00, 'assets/cars/honda.fit.jpeg', 1, 'Hatchback', 'Automatic', 5],
                ['Honda', 'Vezel', 2021, 100.00, 'assets/cars/honda.vezel.webp', 1, 'SUV', 'Automatic', 5],
                ['Nissan', 'Sentra', 2020, 90.00, 'assets/cars/nissan.jpg', 1, 'Sedan', 'Automatic', 5],
                ['Toyota', 'Corolla Axio', 2018, 80.00, 'assets/cars/toyota.axio.jpg', 1, 'Sedan', 'Automatic', 5],
                ['Toyota', 'Crown', 2021, 140.00, 'assets/cars/toyota.crown.jpg', 1, 'Sedan', 'Automatic', 5],
                ['Toyota', 'Noah', 2020, 120.00, 'assets/cars/toyota.noah.jpg', 1, 'Minivan', 'Automatic', 7],
                ['Toyota', 'Probox', 2017, 75.00, 'assets/cars/toyota.probox.jpeg', 1, 'Wagon', 'Automatic', 5],
                ['Toyota', 'Vitz', 2019, 70.00, 'assets/cars/toyota.vitz.webp', 1, 'Hatchback', 'Automatic', 5]
            ];

            for (const car of userCars) {
                await db.promise().query(`
                    INSERT INTO cars (make, model, year, price_per_day, image_url, available, category, transmission, seats)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, car);
            }
            console.log(`Inserted ${userCars.length} cars.`);
        } else {
            console.log('Cars table already has records.');
        }

        res.json({ message: 'Database seeded successfully' });
    } catch (err) {
        console.error('Seeding Error:', err.message);
        res.status(500).json({ message: 'Seeding failed', error: err.message });
    }
};

module.exports = {
    subscribeNewsletter,
    submitContactForm,
    seedDatabase
};

