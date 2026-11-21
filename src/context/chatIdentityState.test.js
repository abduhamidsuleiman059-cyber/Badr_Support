import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  canApplyAuthResult,
  canApplyInitialSession,
  getActiveThreadIdForIdentity,
  getThreadsForIdentity,
} from './chatIdentityState.js';

const threads = [
  { id: 'guest-1', ownerUserId: null, conversationId: null },
  { id: 'account-a-1', ownerUserId: 'account-a', conversationId: 'saved-a' },
  { id: 'account-b-1', ownerUserId: 'account-b', conversationId: 'saved-b' },
];

test('only exposes guest or current-account threads', () => {
  assert.deepEqual(getThreadsForIdentity(threads, null).map((thread) => thread.id), ['guest-1']);
  assert.deepEqual(getThreadsForIdentity(threads, 'account-a').map((thread) => thread.id), ['account-a-1']);
  assert.deepEqual(getThreadsForIdentity(threads, 'account-b').map((thread) => thread.id), ['account-b-1']);
});

test('does not reactivate an active thread from another identity', () => {
  assert.equal(getActiveThreadIdForIdentity('guest-1', threads, 'account-a', [{ id: 'saved-a' }]), 'saved-a');
  assert.equal(getActiveThreadIdForIdentity('account-a-1', threads, 'account-b', [{ id: 'saved-b' }]), 'saved-b');
});

test('ignores stale requests after account changes, including switching back', () => {
  assert.equal(canApplyAuthResult('account-a', 1, 'account-a', 3), false);
  assert.equal(canApplyAuthResult('account-a', 3, 'account-a', 3), true);
});

test('does not apply an initial session result after a newer auth event', () => {
  assert.equal(canApplyInitialSession(0, 1), false);
  assert.equal(canApplyInitialSession(2, 2), true);
});
