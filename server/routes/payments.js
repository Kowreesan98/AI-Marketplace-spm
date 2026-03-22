const express = require('express');
const router = express.Router();
const { createPaymentIntent, confirmPayment, getPaymentHistory, getPaymentStatus } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');

// Create a payment intent
router.post('/create-payment-intent', authMiddleware, createPaymentIntent);

// Confirm payment after successful payment
router.post('/confirm', authMiddleware, confirmPayment);

// Get payment history
router.get('/history', authMiddleware, getPaymentHistory);

// Get payment status
router.get('/status/:paymentIntentId', authMiddleware, getPaymentStatus);

module.exports = router;
