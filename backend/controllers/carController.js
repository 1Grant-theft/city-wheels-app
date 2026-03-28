const db = require('../config/db');

// Add a new car (Admin only)
const addCar = (req, res) => {
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
};

// Edit a car (Admin only)
const editCar = (req, res) => {
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
};

// Get all cars (Public)
const getAllCars = (req, res) => {
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
};

module.exports = {
    addCar,
    editCar,
    getAllCars
};
