import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  exchangeAuthCallbackCode,
  getAuthCallbackCode,
  hasAuthCallbackError,
} from './authCallback.js';

test('reads the authorization code from a callback URL without exposing it', () => {
  assert.equal(getAuthCallbackCode('badrsupport:///?code=one-time-code&type=recovery'), 'one-time-code');
  assert.equal(getAuthCallbackCode('not a url'), null);
});

test('exchanges a callback code and returns the restored session', async () => {
  let receivedCode;
  const session = { user: { id: 'user-123' } };
  const restored = await exchangeAuthCallbackCode({
    auth: {
      async exchangeCodeForSession(code) {
        receivedCode = code;
        return { data: { session }, error: null };
      },
    },
  }, 'badrsupport:///?code=one-time-code');

  assert.equal(receivedCode, 'one-time-code');
  assert.equal(restored, session);
});

test('does not attempt a code exchange when the URL has no authorization code', async () => {
  const restored = await exchangeAuthCallbackCode({
    auth: {
      exchangeCodeForSession() {
        assert.fail('No code should be exchanged.');
      },
    },
  }, 'badrsupport:///');

  assert.equal(restored, null);
});

test('detects an OAuth provider cancellation without exposing its details', () => {
  assert.equal(hasAuthCallbackError('badrsupport:///auth?error=access_denied'), true);
  assert.equal(hasAuthCallbackError('badrsupport:///auth?code=one-time-code'), false);
});

test('surfaces a safe error when Supabase rejects the callback code', async () => {
  await assert.rejects(
    exchangeAuthCallbackCode({
      auth: {
        async exchangeCodeForSession() {
          return { data: { session: null }, error: new Error('sensitive provider detail') };
        },
      },
    }, 'badrsupport:///?code=one-time-code'),
    { message: 'Unable to complete the authentication redirect.' },
  );
});
