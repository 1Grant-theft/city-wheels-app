const mysql = require('mysql2/promise');

async function seedUserCars() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '1BrickBrick1$',
        database: 'car_rental'
    });

    console.log('Connected to MySQL.');

    // Clear previous generic cars
    await db.query('TRUNCATE TABLE cars');

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
        await db.query(`
            INSERT INTO cars (make, model, year, price_per_day, image_url, available, category, transmission, seats)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, car);
    }
    
    console.log(`Inserted ${userCars.length} user cars.`);

    await db.end();
    console.log('Done mapping user cars.');
}

seedUserCars().catch(err => console.error(err));
