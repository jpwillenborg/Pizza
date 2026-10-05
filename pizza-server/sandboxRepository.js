import { createHash, randomBytes, randomUUID } from 'node:crypto';

const sandboxKeyPattern = /^[A-Za-z0-9_-]{43}$/;
const orderIdPattern = /^ORD-[0-9a-f]{8}$/i;

export function createSandboxKey() {
  return randomBytes(32).toString('base64url');
}

export function hashSandboxKey(key) {
  return createHash('sha256').update(key).digest('hex');
}

export function createOrderId() {
  return `ORD-${randomBytes(4).toString('hex')}`;
}

export function isValidOrderId(orderId) {
  return typeof orderId === 'string' && orderIdPattern.test(orderId);
}

export function formatOrderTimestamp(date = new Date()) {
  const timestamp = date instanceof Date ? date : new Date(date);
  const datePart = timestamp.toLocaleDateString('en-US', {
    timeZone: 'America/Chicago',
    month: '2-digit',
    day: '2-digit',
    year: '2-digit'
  });
  const timePart = timestamp.toLocaleTimeString('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return `${datePart} @ ${timePart}`;
}

export async function migrateLegacyOrderDisplayFormat(db) {
  const connection = await db.getConnection();
  let migratedCount = 0;

  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(`
      SELECT db_id, order_id, timestamp
      FROM orders
      WHERE sandbox_id IS NOT NULL
        AND (
          order_id LIKE 'ORD-________-____-____-____-____________'
          OR timestamp LIKE '____-__-__T%'
        )
      FOR UPDATE
    `);

    for (const row of rows) {
      let orderId = row.order_id;
      if (/^ORD-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
        orderId = `ORD-${orderId.slice(4, 12).toLowerCase()}`;
        let [conflicts] = await connection.query(
          'SELECT db_id FROM orders WHERE order_id = ? AND db_id <> ? LIMIT 1',
          [orderId, row.db_id]
        );
        while (conflicts.length > 0) {
          orderId = createOrderId();
          [conflicts] = await connection.query(
            'SELECT db_id FROM orders WHERE order_id = ? AND db_id <> ? LIMIT 1',
            [orderId, row.db_id]
          );
        }
      }

      const parsedTimestamp = new Date(row.timestamp);
      const timestamp = Number.isNaN(parsedTimestamp.getTime())
        ? row.timestamp
        : formatOrderTimestamp(parsedTimestamp);

      await connection.query(
        'UPDATE orders SET order_id = ?, timestamp = ? WHERE db_id = ?',
        [orderId, timestamp, row.db_id]
      );
      migratedCount += 1;
    }

    await connection.commit();
    return migratedCount;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function findSandboxByKey(db, key) {
  if (typeof key !== 'string' || !sandboxKeyPattern.test(key)) return null;

  const [rows] = await db.query(
    'SELECT sandbox_id, expires_at FROM demo_sandboxes WHERE admin_key_hash = ? AND expires_at > UTC_TIMESTAMP() LIMIT 1',
    [hashSandboxKey(key)]
  );
  return rows[0] ?? null;
}

export async function createSandbox(db, seedOrders, ttlHours = 24) {
  const connection = await db.getConnection();
  const sandboxId = randomUUID();
  const adminKey = createSandboxKey();
  const adminKeyHash = hashSandboxKey(adminKey);
  const expiresAtDate = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  const expiresAt = expiresAtDate
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');

  try {
    await connection.beginTransaction();
    await connection.query(
      'INSERT INTO demo_sandboxes (sandbox_id, admin_key_hash, expires_at) VALUES (?, ?, ?)',
      [sandboxId, adminKeyHash, expiresAt]
    );

    for (const order of seedOrders) {
      await insertOrder(connection, sandboxId, order);
    }

    await connection.commit();
    return { sandboxId, adminKey, expiresAt: expiresAtDate.toISOString(), seededOrderCount: seedOrders.length };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export function requireSandbox(db) {
  return async (req, res, next) => {
    const adminKey = req.get('x-sandbox-key') || '';
    if (!sandboxKeyPattern.test(adminKey)) {
      return res.status(401).json({ error: 'A valid visitor sandbox key is required.' });
    }

    try {
      const sandbox = await findSandboxByKey(db, adminKey);
      if (!sandbox) {
        return res.status(401).json({ error: 'This visitor sandbox key is invalid or expired.' });
      }

      req.sandbox = { id: sandbox.sandbox_id, expiresAt: sandbox.expires_at };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export async function getOrdersForSandbox(db, sandboxId) {
  const [rows] = await db.query(
    'SELECT order_id, status, total_bill, timestamp, items_json, customer_name, customer_phone, customer_address FROM orders WHERE sandbox_id = ? ORDER BY db_id DESC',
    [sandboxId]
  );

  return rows.map((row) => ({
    id: row.order_id,
    status: row.status,
    totalBill: row.total_bill,
    timestamp: row.timestamp,
    customer: {
      name: row.customer_name,
      phone: row.customer_phone,
      address: row.customer_address
    },
    items: JSON.parse(row.items_json)
  }));
}

export async function insertOrderForSandbox(db, sandboxId, order) {
  return insertOrder(db, sandboxId, order);
}

async function insertOrder(db, sandboxId, order) {
  let orderId = order.id;
  let attempts = 0;

  while (true) {
    orderId ??= createOrderId();
    try {
      await db.query(
        `INSERT INTO orders (sandbox_id, order_id, customer_name, customer_phone, customer_address, status, total_bill, timestamp, items_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sandboxId,
          orderId,
          order.customer.name,
          order.customer.phone,
          order.customer.address,
          order.status ?? 'Received',
          Number(order.total).toFixed(2),
          order.timestamp ?? formatOrderTimestamp(),
          JSON.stringify(order.items)
        ]
      );
      return { ...order, id: orderId, status: order.status ?? 'Received' };
    } catch (error) {
      if (order.id || error.code !== 'ER_DUP_ENTRY' || attempts >= 4) throw error;
      attempts += 1;
      orderId = undefined;
    }
  }
}

export async function getOrderStatusForSandbox(db, sandboxId, orderId) {
  const [rows] = await db.query(
    'SELECT status FROM orders WHERE sandbox_id = ? AND order_id = ? LIMIT 1',
    [sandboxId, orderId]
  );
  return rows[0]?.status ?? null;
}

export async function updateOrderStatusForSandbox(db, sandboxId, orderId, status) {
  const [result] = await db.query(
    'UPDATE orders SET status = ? WHERE sandbox_id = ? AND order_id = ?',
    [status, sandboxId, orderId]
  );

  if (result.affectedRows > 0) return { found: true, status };

  const currentStatus = await getOrderStatusForSandbox(db, sandboxId, orderId);
  return { found: currentStatus !== null, status: currentStatus };
}

export async function deleteOrdersForSandbox(db, sandboxId) {
  return db.query('DELETE FROM orders WHERE sandbox_id = ?', [sandboxId]);
}

export async function cleanExpiredSandboxes(db) {
  await db.query(`
    DELETE FROM orders
    WHERE sandbox_id IN (
      SELECT sandbox_id FROM demo_sandboxes WHERE expires_at <= UTC_TIMESTAMP()
    )
  `);
  await db.query('DELETE FROM demo_sandboxes WHERE expires_at <= UTC_TIMESTAMP()');
}
