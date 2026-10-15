'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { app, menu } = require('../src/server');

let server;
let baseUrl;

test('start test server', async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test('GET /health returns healthy status', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'restaurant-app');
});

test('GET /api/menu returns sample menu', async () => {
  const response = await fetch(`${baseUrl}/api/menu`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(Array.isArray(body.items));
  assert.ok(body.items.length > 0);
  assert.equal(body.items[0].currency, 'NGN');
});

test('menu entries have required fields and valid prices', () => {
  for (const item of menu) {
    assert.ok(item.id);
    assert.ok(item.name);
    assert.ok(Number.isFinite(item.price) && item.price >= 0);
  }
});

test('GET / renders restaurant landing page', async () => {
  const response = await fetch(`${baseUrl}/`);
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.match(body, /Good food brings everyone to the table/);
  assert.match(body, /Jollof Rice/);
});

test('close test server', async () => {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});
