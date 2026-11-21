import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createChatRetry,
  createChatSubmission,
  createSubmissionId,
} from './chatSubmission.js';

test('creates UUID-shaped submission IDs', () => {
  assert.match(createSubmissionId(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});

test('retries preserve the original submission key and message identity', () => {
  const request = createChatSubmission({
    threadId: 'thread-1',
    content: 'Hello',
    ownerUserId: 'user-1',
  });
  const retry = createChatRetry(request, {
    conversationId: 'c0ffee00-0000-4000-8000-000000000001',
  });

  assert.equal(retry.submissionId, request.submissionId);
  assert.equal(retry.content, request.content);
  assert.equal(retry.threadId, request.threadId);
  assert.equal(retry.conversationId, 'c0ffee00-0000-4000-8000-000000000001');
});
