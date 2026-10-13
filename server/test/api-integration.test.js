import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/index.js';

let testServer;
let baseUrl = '';
let authToken = '';

test.before(async () => {
  await new Promise(resolve => {
    testServer = app.listen(0, () => {
      const port = testServer.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

test.after(() => {
  if (testServer) testServer.close();
});

test('GET /api/health returns 200 ok', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.status, 'ok');
});

test('POST /api/auth/login fails with invalid credentials', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent@stratagem.ai', password: 'wrong' })
  });
  const data = await res.json();
  assert.equal(res.status, 401);
  assert.equal(data.success, false);
});

test('POST /api/auth/demo-login returns token and user profile', async () => {
  const res = await fetch(`${baseUrl}/api/auth/demo-login`, {
    method: 'POST'
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(data.token);
  assert.equal(data.user.email, 'demo@stratagem.ai');
  authToken = data.token;
});

test('GET /api/decisions lists pre-seeded enterprise decisions for authenticated user', async () => {
  const res = await fetch(`${baseUrl}/api/decisions`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(data.data));
  assert.ok(data.data.length >= 3);
});

test('POST /api/decisions/:id/simulate runs Monte Carlo risk simulation', async () => {
  const res = await fetch(`${baseUrl}/api/decisions/dec-cloud-infra-2025/simulate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      iterations: 500,
      distribution: 'triangular'
    })
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(data.data.simulation);
  assert.equal(data.data.simulation.iterations, 500);
  assert.ok(data.data.explanation.executiveVerdict);
});

test('POST /api/decisions/ingest parses fragmented CSV data', async () => {
  const csvContent = `Provider,Reliability,MonthlyCost,LatencyMs\nCloudA,99.9,450,25\nCloudB,99.5,320,38\nCloudC,99.8,390,29`;
  const res = await fetch(`${baseUrl}/api/decisions/ingest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ csvText: csvContent })
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.data.alternatives.length, 3);
  assert.equal(data.data.criteria.length, 3);
});
