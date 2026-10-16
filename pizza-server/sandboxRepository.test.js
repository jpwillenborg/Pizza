import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createSandbox,
  createOrderId,
  createSandboxKey,
  deleteOrdersForSandbox,
  formatOrderTimestamp,
  getOrderStatusForSandbox,
  getOrdersForSandbox,
  hashSandboxKey,
  isValidOrderId,
  migrateLegacyOrderDisplayFormat,
  requireSandbox,
  updateOrderStatusForSandbox
} from './sandboxRepository.js';

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test('sandbox keys are random bearer credentials and only their hash is used for lookup', async () => {
  const firstKey = createSandboxKey();
  const secondKey = createSandboxKey();
  const queries = [];
  const db = {
    async query(sql, values) {
      queries.push({ sql, values });
      return [[{ sandbox_id: 'sandbox-a', expires_at: new Date() }]];
    }
  };
  const middleware = requireSandbox(db);
  const request = { get: () => firstKey, body: { sandboxId: 'sandbox-b' } };
  const response = createResponse();
  let continued = false;

  await middleware(request, response, () => { continued = true; });

  assert.equal(firstKey.length, 43);
  assert.notEqual(firstKey, secondKey);
  assert.notEqual(hashSandboxKey(firstKey), firstKey);
  assert.equal(queries[0].values[0], hashSandboxKey(firstKey));
  assert.match(queries[0].sql, /admin_key_hash = \?/);
  assert.equal(request.sandbox.id, 'sandbox-a');
  assert.equal(continued, true);
});

test('sandbox key and seeded orders are committed together, storing only the key hash', async () => {
  const queries = [];
  let committed = false;
  const connection = {
    async beginTransaction() {},
    async query(sql, values) {
      queries.push({ sql, values });
      return [{ affectedRows: 1 }];
    },
    async commit() { committed = true; },
    async rollback() { assert.fail('transaction should commit'); },
    release() {}
  };
  const db = { async getConnection() { return connection; } };
  const sandbox = await createSandbox(db, [{
    customer: { name: 'Demo Guest', phone: '314-555-0101', address: 'DEMO DELIVERY ONLY' },
    items: [{ size: 'small', toppings: [] }],
    total: 6.5
  }]);

  assert.equal(committed, true);
  assert.equal(sandbox.seededOrderCount, 1);
  assert.notEqual(queries[0].values[1], sandbox.adminKey);
  assert.equal(queries[0].values[1], hashSandboxKey(sandbox.adminKey));
  assert.equal(queries[1].values[0], sandbox.sandboxId);
});

test('sandbox authorization rejects missing keys without a database lookup', async () => {
  let queryCount = 0;
  const middleware = requireSandbox({
    async query() {
      queryCount += 1;
      return [[]];
    }
  });
  const response = createResponse();

  await middleware({ get: () => '' }, response, () => assert.fail('next must not be called'));

  assert.equal(response.statusCode, 401);
  assert.equal(queryCount, 0);
});

test('sandbox authorization rejects expired or unknown keys', async () => {
  const middleware = requireSandbox({ async query() { return [[]]; } });
  const response = createResponse();

  await middleware({ get: () => createSandboxKey() }, response, () => assert.fail('next must not be called'));

  assert.equal(response.statusCode, 401);
});

test('order history is queried only for the authenticated sandbox', async () => {
  const queries = [];
  const db = {
    async query(sql, values) {
      queries.push({ sql, values });
      return [[{
        order_id: 'ORD-test',
        status: 'Received',
        total_bill: '8.00',
        timestamp: '2026-10-01T00:00:00.000Z',
        items_json: '[]',
        customer_name: 'Demo Guest',
        customer_phone: '314-555-0101',
        customer_address: 'DEMO DELIVERY ONLY'
      }]];
    }
  };

  const orders = await getOrdersForSandbox(db, 'sandbox-a');

  assert.match(queries[0].sql, /WHERE sandbox_id = \?/i);
  assert.deepEqual(queries[0].values, ['sandbox-a']);
  assert.equal(orders[0].customer.name, 'Demo Guest');
});

test('status updates and history deletion cannot cross sandbox boundaries', async () => {
  const queries = [];
  const db = {
    async query(sql, values) {
      queries.push({ sql, values });
      return [{ affectedRows: 1 }];
    }
  };

  await updateOrderStatusForSandbox(db, 'sandbox-a', 'ORD-test', 'Baking');
  await deleteOrdersForSandbox(db, 'sandbox-a');

  assert.match(queries[0].sql, /WHERE sandbox_id = \? AND order_id = \?/i);
  assert.deepEqual(queries[0].values, ['Baking', 'sandbox-a', 'ORD-test']);
  assert.match(queries[1].sql, /DELETE FROM orders WHERE sandbox_id = \?/i);
  assert.deepEqual(queries[1].values, ['sandbox-a']);
});

test('order status lookups are scoped to both sandbox and order ID', async () => {
  const queries = [];
  const db = {
    async query(sql, values) {
      queries.push({ sql, values });
      return [[{ status: 'Preparing' }]];
    }
  };

  const status = await getOrderStatusForSandbox(db, 'sandbox-a', 'ORD-test');

  assert.equal(status, 'Preparing');
  assert.match(queries[0].sql, /WHERE sandbox_id = \? AND order_id = \?/i);
  assert.deepEqual(queries[0].values, ['sandbox-a', 'ORD-test']);
});

test('reapplying the current status succeeds when MySQL reports no changed rows', async () => {
  const queries = [];
  const db = {
    async query(sql, values) {
      queries.push({ sql, values });
      if (sql.startsWith('UPDATE orders')) return [{ affectedRows: 0 }];
      return [[{ status: 'Preparing' }]];
    }
  };

  const result = await updateOrderStatusForSandbox(db, 'sandbox-a', 'ORD-cfd83d17', 'Preparing');

  assert.deepEqual(result, { found: true, status: 'Preparing' });
  assert.equal(queries.length, 2);
  assert.deepEqual(queries[1].values, ['sandbox-a', 'ORD-cfd83d17']);
});

test('order IDs use the short display format and reject old UUID-shaped input', () => {
  const orderId = createOrderId();

  assert.match(orderId, /^ORD-[0-9a-f]{8}$/);
  assert.equal(isValidOrderId(orderId), true);
  assert.equal(isValidOrderId('ORD-cfd83d17-b392-40d7-b761-b3889ce55aa6'), false);
});

test('timestamps retain the previous Central-time display format', () => {
  const expected = '10/01/26 @ 7:00:00 AM';
  assert.equal(formatOrderTimestamp(new Date('2026-10-01T12:00:00.000Z')), expected);
  assert.equal(formatOrderTimestamp('2026-10-01T12:00:00.000Z'), expected);
});

test('startup migration shortens existing UUID IDs and restores displayed timestamps', async () => {
  const updates = [];
  const migrationQueries = [];
  const connection = {
    async beginTransaction() {},
    async query(sql, values) {
      migrationQueries.push(sql);
      if (sql.includes('SELECT db_id, order_id, timestamp')) {
        return [[{
          db_id: 14,
          sandbox_id: 'sandbox-a',
          order_id: 'ORD-cfd83d17-b392-40d7-b761-b3889ce55aa6',
          timestamp: '2026-10-01T12:00:00.000Z'
        }]];
      }
      if (sql.includes('SELECT db_id FROM orders')) return [[]];
      if (sql.includes('UPDATE orders SET order_id')) {
        updates.push(values);
        return [{ affectedRows: 1 }];
      }
      assert.fail(`Unexpected SQL: ${sql}`);
    },
    async commit() {},
    async rollback() { assert.fail('migration should commit'); },
    release() {}
  };

  const migratedCount = await migrateLegacyOrderDisplayFormat({
    async getConnection() { return connection; }
  });

  assert.equal(migratedCount, 1);
  assert.match(migrationQueries[0], /sandbox_id IS NOT NULL/i);
  assert.deepEqual(updates, [['ORD-cfd83d17', '10/01/26 @ 7:00:00 AM', 14]]);
});
