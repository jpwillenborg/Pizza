import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mysql from 'mysql2/promise';
import rateLimit from 'express-rate-limit';
import { validateOrderItems } from './orderValidation.js';
import {
  cleanExpiredSandboxes,
  createSandbox,
  deleteOrdersForSandbox,
  findSandboxByKey,
  getOrderStatusForSandbox,
  getOrdersForSandbox,
  isValidOrderId,
  insertOrderForSandbox,
  migrateLegacyOrderDisplayFormat,
  requireSandbox,
  updateOrderStatusForSandbox
} from './sandboxRepository.js';

const app = express();
const PORT = process.env.PORT || 5000; 

app.set('trust proxy', 1);

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim()).filter(Boolean)
  : ["http://localhost:5174", "https://pizza.jpwillenborg.com"];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '16kb' }));

const orderRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many demo orders. Please try again later.' }
});

const sandboxCreationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many demo sandboxes were created. Please try again later.' }
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

const db = mysql.createPool({
  host: process.env.DB_HOST,               
  user: process.env.DB_USER,         
  password: process.env.DB_PASSWORD,  
  database: process.env.DB_DATABASE,   
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initializeDatabaseSchema() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        db_id INT AUTO_INCREMENT PRIMARY KEY,
        sandbox_id CHAR(36) NOT NULL,
        order_id VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        customer_address VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'Received',
        total_bill VARCHAR(20),
        timestamp VARCHAR(50),
        items_json TEXT NOT NULL
      )
    `);

    const legacyColumns = [
      ['sandbox_id', 'CHAR(36) NULL'],
      ['customer_name', 'VARCHAR(100) NULL'],
      ['customer_phone', 'VARCHAR(50) NULL'],
      ['customer_address', 'VARCHAR(255) NULL']
    ];

    for (const [columnName, definition] of legacyColumns) {
      try {
        await db.query(`ALTER TABLE orders ADD COLUMN ${columnName} ${definition}`);
      } catch (error) {
        if (error.code !== 'ER_DUP_FIELDNAME') throw error;
      }
    }

    await db.query(`
      CREATE TABLE IF NOT EXISTS demo_sandboxes (
        sandbox_id CHAR(36) PRIMARY KEY,
        admin_key_hash CHAR(64) NOT NULL UNIQUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL
      )
    `);

    try {
      await db.query('CREATE INDEX idx_orders_sandbox_db ON orders (sandbox_id, db_id)');
    } catch (error) {
      if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }

    const migratedOrders = await migrateLegacyOrderDisplayFormat(db);
    if (migratedOrders > 0) {
      console.log(`Updated ${migratedOrders} legacy demo order display records.`);
    }

    console.log('💾 Remote Bluehost SQL Database Grid Synced: SUCCESS');
  } catch (err) {
    console.error('❌ Bluehost Connection Initialization Failure:', err.message || err);
  }
}
const schemaInitialization = initializeDatabaseSchema();
const sandboxCleanupTimer = setInterval(async () => {
  try {
    await schemaInitialization;
    await cleanExpiredSandboxes(db);
  } catch (error) {
    console.error('Expired demo sandbox cleanup failed:', error);
  }
}, 60 * 60 * 1000);
sandboxCleanupTimer.unref();

const DATASTORE_MENU = {
  basePrices: { small: 6.50, medium: 8.00, large: 10.50 },
  toppings: [
    { id: 'pepperoni', name: 'Pepperoni', price: 1.00, category: 'meat', code: 'PEP' },
    { id: 'ham', name: 'Ham', price: 1.00, category: 'meat', code: 'HAM' },
    { id: 'bacon', name: 'Bacon', price: 1.50, category: 'meat', code: 'BCN' },
    { id: 'red_peppers', name: 'Red Peppers', price: 0.75, category: 'veggie', code: 'PEP' },
    { id: 'pineapple', name: 'Pineapple', price: 0.75, category: 'veggie', code: 'PIN' },
    { id: 'onions', name: 'Onions', price: 0.50, category: 'veggie', code: 'ONN' },
    { id: 'extra_cheese', name: 'Extra Cheese', price: 1.00, category: 'cheese', code: 'CHS' }
  ]
};

const STATUS_STAGES = ['Received', 'Preparing', 'Baking', 'Out for Delivery', 'Delivered'];

const DEMO_ORDER_PLANS = [
  {
    status: 'Preparing',
    customer: { name: 'Christopher Test', phone: '+1-314-555-0101', address: 'DEMO DELIVERY ONLY' },
    pizzas: [{ size: 'medium', toppings: ['pepperoni'] }]
  },
  {
    status: 'Delivered',
    customer: { name: 'Mary Sample', phone: '+1-314-555-0102', address: 'DEMO DELIVERY ONLY' },
    pizzas: [{ size: 'small', toppings: ['ham'] }]
  },
  {
    status: 'Received',
    customer: { name: 'Patrick Demo', phone: '+1-314-555-0103', address: 'DEMO DELIVERY ONLY' },
    pizzas: [
      { size: 'large', toppings: ['bacon', 'red_peppers', 'pineapple'] },
      { size: 'medium', toppings: ['extra_cheese'] }
    ]
  }
];

const requestedSandboxTtlHours = Number(process.env.SANDBOX_TTL_HOURS);
const sandboxTtlHours = Number.isFinite(requestedSandboxTtlHours) && requestedSandboxTtlHours > 0
  ? Math.min(requestedSandboxTtlHours, 168)
  : 24;

function createSeedOrders() {
  return DEMO_ORDER_PLANS.map((plan) => {
    const order = validateOrderItems(plan.pizzas, DATASTORE_MENU);
    return {
      status: plan.status,
      customer: plan.customer,
      items: order.items,
      total: order.total
    };
  });
}

const requireVisitorSandbox = requireSandbox(db);

// --- REST API ENDPOINTS ---

app.get('/api/menu', (req, res) => {
  res.status(200).json(DATASTORE_MENU);
});

app.post('/api/sandboxes', sandboxCreationRateLimiter, async (_req, res) => {
  try {
    await schemaInitialization;
    await cleanExpiredSandboxes(db);
    const sandbox = await createSandbox(db, createSeedOrders(), sandboxTtlHours);
    res.status(201).json(sandbox);
  } catch (err) {
    console.error('Visitor sandbox creation failed:', err);
    res.status(503).json({ error: 'Unable to create a demo sandbox right now.' });
  }
});

app.get('/api/orders/history', requireVisitorSandbox, async (req, res) => {
  try {
    const history = await getOrdersForSandbox(db, req.sandbox.id);
    res.status(200).json(history);
  } catch (err) {
    console.error('Sandbox order history query failed:', err);
    res.status(500).json({ error: 'Unable to load this demo order history.' });
  }
});

app.post('/api/orders', orderRateLimiter, requireVisitorSandbox, async (req, res) => {
  const { items } = req.body ?? {};
  const validation = validateOrderItems(items, DATASTORE_MENU);
  if (validation.error) return res.status(400).json({ message: validation.error });

  try {
    const { items: validatedItems, total: grandTotal } = validation;
    const order = {
      customer: {
        name: 'Sandbox Guest',
        phone: '+1-202-555-0100',
        address: 'DEMO DELIVERY ONLY'
      },
      items: validatedItems,
      total: grandTotal
    };
    const savedOrder = await insertOrderForSandbox(db, req.sandbox.id, order);

    console.log(`Demo order stored: ${savedOrder.id}`);

    io.to(`sandbox:${req.sandbox.id}:order:${savedOrder.id}`).emit('order_status_changed', { id: savedOrder.id, status: 'Received' });
    res.status(201).json({ id: savedOrder.id, status: 'Received' });
  } catch (err) {
    console.error('Order creation failed:', err);
    res.status(500).json({ error: 'Unable to place the demo order.' });
  }
});

app.get('/api/orders/track', requireVisitorSandbox, async (req, res) => {
  const orderId = req.query.id;
  if (!isValidOrderId(orderId)) {
    return res.status(400).json({ error: 'A valid order ID is required.' });
  }

  try {
    const status = await getOrderStatusForSandbox(db, req.sandbox.id, orderId);
    if (!status) return res.status(404).json({ error: 'Order not found in this demo sandbox.' });
    res.json({ status });
  } catch (err) {
    console.error('Order tracking query failed:', err);
    res.status(500).json({ error: 'Unable to load order status.' });
  }
});

app.put('/api/orders/status', requireVisitorSandbox, async (req, res) => {
  const { id, status } = req.body ?? {};

  if (!isValidOrderId(id)) {
    return res.status(400).json({ message: 'Missing target order ID parameter.' });
  }
  if (!STATUS_STAGES.includes(status)) {
    return res.status(400).json({ message: 'Invalid status stage token submitted.' });
  }

  try {
    const updateResult = await updateOrderStatusForSandbox(db, req.sandbox.id, id, status);

    if (!updateResult.found) {
      return res.status(404).json({ message: `No active transaction records found matching: ${id}` });
    }

    console.log(`Demo order ${id} status is "${updateResult.status}" in sandbox ${req.sandbox.id}`);

    io.to(`sandbox:${req.sandbox.id}:order:${id}`).emit('order_status_changed', { id, status: updateResult.status });
    res.status(200).json({ message: 'Demo order status is up to date.', status: updateResult.status });
  } catch (err) {
    console.error('Order status update failed:', err);
    res.status(500).json({ error: 'Unable to update order status.' });
  }
});

app.delete('/api/orders/history', requireVisitorSandbox, async (req, res) => {
  try {
    await deleteOrdersForSandbox(db, req.sandbox.id);
    console.log(`Cleared demo orders for sandbox ${req.sandbox.id}`);
    
    res.status(204).end();
  } catch (err) {
    console.error('Order history deletion failed:', err);
    res.status(500).json({ error: 'Unable to clear order history.' });
  }
});

// --- SOCKET CONNECTIONS INITIAL HANDSHAKES ---
io.on('connection', async (socket) => {
  console.log(`... WebSocket linked: ${socket.id}`);
  socket.on('track_order', async ({ id: orderId, sandboxKey } = {}) => {
    if (!isValidOrderId(orderId)) {
      socket.emit('order_not_found');
      return;
    }

    try {
      const sandbox = await findSandboxByKey(db, sandboxKey);
      if (!sandbox) {
        socket.emit('order_not_found');
        return;
      }

      const status = await getOrderStatusForSandbox(db, sandbox.sandbox_id, orderId);
      if (!status) {
        socket.emit('order_not_found');
        return;
      }

      await socket.join(`sandbox:${sandbox.sandbox_id}:order:${orderId}`);
      socket.emit('order_status_changed', { id: orderId, status });
    } catch (err) {
      console.error('Socket order tracking lookup failed:', err);
      socket.emit('order_not_found');
    }
  });

  socket.on('disconnect', () => {
    console.log(`... Client disconnected: ${socket.id}`);
  });
});

// Start listening through your WebSocket server wrapper instance node
httpServer.listen(PORT, () => {
  console.log(`🚀 Hybrid Production API Server listening safely on port ${PORT}`);
});
