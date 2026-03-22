const Stripe = require('stripe');
const { dbGet, dbAll, dbRun } = require('../database');

// Initialize Stripe with test secret key
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const createPaymentIntent = async (req, res) => {
  try {
    const { amount, agentId, agentName, durationHours } = req.body;
    const userId = req.user.id;
    
    if (!stripe) {
      // Demo mode - return mock payment intent
      const mockPaymentIntent = {
        id: 'pi_demo_' + Date.now(),
        client_secret: 'demo_secret_' + Date.now(),
        amount: Math.round(amount * 100),
        currency: 'usd',
        status: 'requires_payment_method'
      };
      
      // Store payment record
      await dbRun(
        'INSERT INTO payments (user_id, stripe_payment_intent_id, amount, status, description) VALUES (?, ?, ?, ?, ?)',
        [userId, mockPaymentIntent.id, amount, 'pending', `Hire ${agentName} for ${durationHours} hours`]
      );
      
      return res.json({
        clientSecret: mockPaymentIntent.client_secret,
        paymentIntentId: mockPaymentIntent.id,
        demo: true
      });
    }
    
    // Create Stripe PaymentIntent
    console.log('Using Stripe Secret Key:', stripe.apiKey ? stripe.apiKey.substring(0, 15) + '...' : 'NONE');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: userId.toString(),
        agentId: agentId.toString(),
        agentName,
        durationHours: durationHours.toString()
      },
      description: `Hire ${agentName} for ${durationHours} hours`
    });
    
    // Store payment record
    await dbRun(
      'INSERT INTO payments (user_id, stripe_payment_intent_id, amount, status, description) VALUES (?, ?, ?, ?, ?)',
      [userId, paymentIntent.id, amount, 'pending', `Hire ${agentName} for ${durationHours} hours`]
    );
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      demo: false
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, sessionId } = req.body;
    const userId = req.user.id;
    
    if (!stripe) {
      // Demo mode - mark payment as successful
      await dbRun(
        'UPDATE payments SET status = ?, session_id = ? WHERE stripe_payment_intent_id = ? AND user_id = ?',
        ['succeeded', sessionId || null, paymentIntentId, userId]
      );
      
      return res.json({ success: true, demo: true });
    }
    
    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      await dbRun(
        'UPDATE payments SET status = ?, session_id = ? WHERE stripe_payment_intent_id = ? AND user_id = ?',
        ['succeeded', sessionId || null, paymentIntentId, userId]
      );
      
      return res.json({ success: true, demo: false });
    }
    
    res.status(400).json({ error: 'Payment not completed' });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const payments = await dbAll(`
      SELECT 
        p.*,
        s.agent_id,
        a.name as agent_name,
        a.icon as agent_icon
      FROM payments p
      LEFT JOIN sessions s ON p.session_id = s.id
      LEFT JOIN agents a ON s.agent_id = a.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `, [userId]);
    
    res.json(payments);
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const userId = req.user.id;
    
    if (!stripe) {
      // Demo mode
      const payment = await dbGet(
        'SELECT * FROM payments WHERE stripe_payment_intent_id = ? AND user_id = ?',
        [paymentIntentId, userId]
      );
      
      return res.json({
        status: payment?.status || 'pending',
        demo: true
      });
    }
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      demo: false
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  getPaymentStatus
};
