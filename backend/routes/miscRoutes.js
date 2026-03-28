const express = require('express');
const router = express.Router();
const miscController = require('../controllers/miscController');

router.post('/api/newsletter', miscController.subscribeNewsletter);
router.post('/api/contact', miscController.submitContactForm);

module.exports = router;
