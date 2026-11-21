const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createSupabaseAuth } = require('../src/middleware/supabaseAuth');

async function invokeMiddleware(middleware, authorization) {
  const req = {
    get(name) {
      return name.toLowerCase() === 'authorization' ? authorization : undefined;
    },
  };
  let nextError;

  await middleware(req, {}, (error) => {
    nextError = error;
  });

  return { req, nextError };
}

test('allows an anonymous chat request without creating an identity', async () => {
  const middleware = createSupabaseAuth({
    getClient() {
      assert.fail('Supabase should not be called when no token is supplied.');
    },
  });

  const { req, nextError } = await invokeMiddleware(middleware);

  assert.equal(nextError, undefined);
  assert.equal(req.authenticatedUser, null);
});

test('requires a bearer token for protected requests', async () => {
  const middleware = createSupabaseAuth({
    required: true,
    getClient() {
      assert.fail('Supabase should not be called without a token.');
    },
  });

  const { nextError } = await invokeMiddleware(middleware);

  assert.equal(nextError.statusCode, 401);
  assert.equal(nextError.publicMessage, undefined);
});

test('verifies bearer tokens with Supabase and exposes only the user ID', async () => {
  let receivedToken;
  const middleware = createSupabaseAuth({
    required: true,
    getClient() {
      return {
        auth: {
          async getUser(token) {
            receivedToken = token;
            return { data: { user: { id: 'user-123', email: 'private@example.test' } }, error: null };
          },
        },
      };
    },
  });

  const { req, nextError } = await invokeMiddleware(middleware, 'Bearer access-token-value');

  assert.equal(nextError, undefined);
  assert.equal(receivedToken, 'access-token-value');
  assert.deepEqual(req.authenticatedUser, { id: 'user-123' });
});

test('does not expose invalid access tokens in authentication errors', async () => {
  const middleware = createSupabaseAuth({
    required: true,
    getClient() {
      return {
        auth: {
          async getUser() {
            return {
              data: { user: null },
              error: Object.assign(new Error('invalid token access-token-value'), { status: 401 }),
            };
          },
        },
      };
    },
  });

  const { nextError } = await invokeMiddleware(middleware, 'Bearer access-token-value');

  assert.equal(nextError.statusCode, 401);
  assert.equal(nextError.message.includes('access-token-value'), false);
});

test('allows chat to continue without persistence when Supabase verification is unavailable', async (t) => {
  let warning;
  t.mock.method(console, 'warn', (...args) => {
    warning = args;
  });
  const middleware = createSupabaseAuth({
    getClient() {
      throw new Error('Supabase failure with secret-value');
    },
  });

  const { req, nextError } = await invokeMiddleware(middleware, 'Bearer access-token-value');

  assert.equal(nextError, undefined);
  assert.equal(req.authenticatedUser, null);
  assert.deepEqual(warning, [
    '[Auth] Supabase verification unavailable; chat will continue without persistence.',
  ]);
  assert.equal(warning.join(' ').includes('secret-value'), false);
  assert.equal(warning.join(' ').includes('access-token-value'), false);
});

test('treats an invalid optional bearer token as an anonymous chat request', async (t) => {
  t.mock.method(console, 'warn', () => {});
  const middleware = createSupabaseAuth({
    getClient() {
      return {
        auth: {
          async getUser() {
            return {
              data: { user: null },
              error: Object.assign(new Error('invalid token'), { status: 401 }),
            };
          },
        },
      };
    },
  });

  const { req, nextError } = await invokeMiddleware(middleware, 'Bearer invalid-token');

  assert.equal(nextError, undefined);
  assert.equal(req.authenticatedUser, null);
});
