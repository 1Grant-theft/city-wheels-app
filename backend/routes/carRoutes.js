const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public route
router.get('/api/cars', carController.getAllCars);

// Admin routes
router.post('/api/cars', authenticateToken, isAdmin, upload.single('image'), carController.addCar);
router.put('/api/cars/:id', authenticateToken, isAdmin, carController.editCar);

module.exports = router;
