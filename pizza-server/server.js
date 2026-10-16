import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mysql from 'mysql2/promise';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
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
const IS_MOCK_MODE = process.env.DB_MODE !== 'mysql';

app.set('trust proxy', 1);

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim()).filter(Boolean)
  : ["http://localhost:5174", "https://jpwillenborg.com"];

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

const mockSandboxes = [];
const mockOrders = [];

let db = null;
let schemaInitialization = Promise.resolve();

if (!IS_MOCK_MODE) {
  db = mysql.createPool({
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
  schemaInitialization = initializeDatabaseSchema();
} else {
  console.log('📦 Server started in Sandbox Mode (Using In-Memory Datastores instead of MySQL)');
}

const sandboxCleanupTimer = setInterval(async () => {
  try {
    if (!IS_MOCK_MODE) {
      await schemaInitialization;
      await cleanExpiredSandboxes(db);
    } else {
      const now = new Date();
      const expiredSandboxIds = mockSandboxes
        .filter(sb => sb.expiresAt <= now)
        .map(sb => sb.sandboxId);
        
      for (const id of expiredSandboxIds) {
        const sbIndex = mockSandboxes.findIndex(s => s.sandboxId === id);
        if (sbIndex !== -1) mockSandboxes.splice(sbIndex, 1);
        
        let i = mockOrders.length;
        while (i--) {
          if (mockOrders[i].sandboxId === id) mockOrders.splice(i, 1);
        }
      }
    }
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

const requireVisitorSandbox = (req, res, next) => {
  if (!IS_MOCK_MODE) {
    return requireSandbox(db)(req, res, next);
  }
  
  const adminKey = req.get('x-sandbox-key') || '';
  const sandbox = mockSandboxes.find(sb => sb.adminKey === adminKey && sb.expiresAt > new Date());
  if (!sandbox) {
    return res.status(401).json({ error: 'This visitor sandbox key is invalid or expired.' });
  }
  
  req.sandbox = { id: sandbox.sandboxId, expiresAt: sandbox.expiresAt.toISOString() };
  next();
};

app.get('/api/menu', (req, res) => {
  res.status(200).json(DATASTORE_MENU);
});

app.post('/api/sandboxes', sandboxCreationRateLimiter, async (_req, res) => {
  try {
    if (!IS_MOCK_MODE) {
      await schemaInitialization;
      await cleanExpiredSandboxes(db);
      const sandbox = await createSandbox(db, createSeedOrders(), sandboxTtlHours);
      return res.status(201).json(sandbox);
    }
    
    const sandboxId = randomUUID();
    const adminKey = `mockKey${randomUUID().replace(/-/g, '').slice(0, 35)}`;
    const expiresAt = new Date(Date.now() + sandboxTtlHours * 60 * 60 * 1000);
    
    mockSandboxes.push({ sandboxId, adminKey, expiresAt });
    
    const seedOrders = createSeedOrders();
    seedOrders.forEach((order, idx) => {
      mockOrders.push({
        id: `ORD-mock00${idx}`,
        sandboxId,
        status: order.status,
        totalBill: order.total,
        timestamp: new Date().toISOString(),
        customer: order.customer,
        items: order.items
      });
    });
    
    res.status(201).json({
      sandboxId,
      adminKey,
      expiresAt: expiresAt.toISOString(),
      seededOrderCount: seedOrders.length
    });
  } catch (err) {
    console.error('Visitor sandbox creation failed:', err);
    res.status(503).json({ error: 'Unable to create a demo sandbox right now.' });
  }
});

app.get('/api/orders/history', requireVisitorSandbox, async (req, res) => {
  try {
    if (!IS_MOCK_MODE) {
      const history = await getOrdersForSandbox(db, req.sandbox.id);
      return res.status(200).json(history);
    }
    
    const contextHistory = mockOrders.filter(o => o.sandboxId === req.sandbox.id);
    res.status(200).json(contextHistory);
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

    let orderId;
    if (!IS_MOCK_MODE) {
      const savedOrder = await insertOrderForSandbox(db, req.sandbox.id, order);
      orderId = savedOrder.id;
    } else {
      orderId = `ORD-${Math.random().toString(16).slice(2, 10)}`;
      mockOrders.push({
        id: orderId,
        sandboxId: req.sandbox.id,
        status: 'Received',
        totalBill: grandTotal,
        timestamp: new Date().toISOString(),
        customer: order.customer,
        items: validatedItems
      });
    }

    console.log(`Demo order stored: ${orderId}`);

    io.to(`sandbox:${req.sandbox.id}:order:${orderId}`).emit('order_status_changed', { id: orderId, status: 'Received' });
    res.status(201).json({ id: orderId, status: 'Received' });
  } catch (err) {
    console.error('Order creation failed:', err);
    res.status(500).json({ error: 'Unable to place the demo order.' });
  }
});

app.get('/api/orders/track', requireVisitorSandbox, async (req, res) => {
  const orderId = req.query.id;
  if (!isValidOrderId(orderId) && IS_MOCK_MODE === false) {
    return res.status(400).json({ error: 'A valid order ID is required.' });
  }

  try {
    if (!IS_MOCK_MODE) {
      const status = await getOrderStatusForSandbox(db, req.sandbox.id, orderId);
      if (!status) return res.status(404).json({ error: 'Order not found in this demo sandbox.' });
      return res.json({ status });
    }
    
    const order = mockOrders.find(o => o.sandboxId === req.sandbox.id && o.id === orderId);
    if (!order) return res.status(404).json({ error: 'Order not found in this demo sandbox.' });
    res.json({ status: order.status });
  } catch (err) {
    console.error('Order tracking query failed:', err);
    res.status(500).json({ error: 'Unable to load order status.' });
  }
});

app.put('/api/orders/status', requireVisitorSandbox, async (req, res) => {
  const { id, status } = req.body ?? {};

  if (!STATUS_STAGES.includes(status)) {
    return res.status(400).json({ message: 'Invalid status stage token submitted.' });
  }

  try {
    if (!IS_MOCK_MODE) {
      if (!isValidOrderId(id)) return res.status(400).json({ message: 'Missing target order ID parameter.' });
      const updateResult = await updateOrderStatusForSandbox(db, req.sandbox.id, id, status);
      if (!updateResult.found) {
        return res.status(404).json({ message: `No active transaction records found matching: ${id}` });
      }
      
      io.to(`sandbox:${req.sandbox.id}:order:${id}`).emit('order_status_changed', { id, status: updateResult.status });
      return res.status(200).json({ message: 'Demo order status is up to date.', status: updateResult.status });
    }
    
    const order = mockOrders.find(o => o.sandboxId === req.sandbox.id && o.id === id);
    if (!order) {
      return res.status(404).json({ message: `No active transaction records found matching: ${id}` });
    }
    order.status = status;
    io.to(`sandbox:${req.sandbox.id}:order:${id}`).emit('order_status_changed', { id, status });
    res.status(200).json({ message: 'Demo order status is up to date.', status });
  } catch (err) {
    console.error('Order status update failed:', err);
    res.status(500).json({ error: 'Unable to update order status.' });
  }
});

app.delete('/api/orders/history', requireVisitorSandbox, async (req, res) => {
  try {
    if (!IS_MOCK_MODE) {
      await deleteOrdersForSandbox(db, req.sandbox.id);
    } else {
      let i = mockOrders.length;
      while (i--) {
        if (mockOrders[i].sandboxId === req.sandbox.id) mockOrders.splice(i, 1);
      }
    }
    console.log(`Cleared demo orders for sandbox ${req.sandbox.id}`);
    res.status(204).end();
  } catch (err) {
    console.error('Order history deletion failed:', err);
    res.status(500).json({ error: 'Unable to clear order history.' });
  }
});

io.on('connection', async (socket) => {
  console.log(`... WebSocket linked: ${socket.id}`);
  socket.on('track_order', async ({ id: orderId, sandboxKey } = {}) => {
    try {
      if (!IS_MOCK_MODE) {
        if (!isValidOrderId(orderId)) return socket.emit('order_not_found');
        const sandbox = await findSandboxByKey(db, sandboxKey);
        if (!sandbox) return socket.emit('order_not_found');
        const status = await getOrderStatusForSandbox(db, sandbox.sandbox_id, orderId);
        if (!status) return socket.emit('order_not_found');

        await socket.join(`sandbox:${sandbox.sandbox_id}:order:${orderId}`);
        return socket.emit('order_status_changed', { id: orderId, status });
      }
      
      const sandbox = mockSandboxes.find(sb => sb.adminKey === sandboxKey);
      if (!sandbox) return socket.emit('order_not_found');
      const order = mockOrders.find(o => o.sandboxId === sandbox.sandboxId && o.id === orderId);
      if (!order) return socket.emit('order_not_found');

      await socket.join(`sandbox:${sandbox.sandboxId}:order:${orderId}`);
      socket.emit('order_status_changed', { id: orderId, status: order.status });
    } catch (err) {
      console.error('Socket order tracking lookup failed:', err);
      socket.emit('order_not_found');
    }
  });

  socket.on('disconnect', () => {
    console.log(`... Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Hybrid Production API Server listening safely on port ${PORT}`);
});
