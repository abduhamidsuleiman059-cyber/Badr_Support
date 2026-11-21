import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  canRetryIncompleteExchange,
  getChatPersistenceNotice,
  getGenerationFailurePersistenceNotice,
} from './chatPersistenceStatus.js';

test('only reports complete persistence when the backend says both messages were saved', () => {
  const complete = {
    status: 'complete',
    userMessageSaved: true,
    assistantMessageSaved: true,
  };
  assert.equal(getChatPersistenceNotice(complete, true), 'Conversation saved to your account.');
  assert.equal(canRetryIncompleteExchange(complete, true), false);
  assert.match(getChatPersistenceNotice({ status: 'complete' }, true), /did not confirm/);
  assert.match(getChatPersistenceNotice(null, true), /did not confirm/);
});

test('distinguishes partial and failed persistence and offers a retry', () => {
  const partial = { status: 'partial', userMessageSaved: true, assistantMessageSaved: false };
  const failed = { status: 'failed', userMessageSaved: false, assistantMessageSaved: false };
  assert.match(getChatPersistenceNotice(partial, true), /complete exchange was not saved/);
  assert.match(getChatPersistenceNotice(failed, true), /neither message was confirmed/);
  assert.equal(canRetryIncompleteExchange(partial, true), true);
  assert.equal(canRetryIncompleteExchange(failed, true), true);
  assert.equal(getGenerationFailurePersistenceNotice(partial), 'Your message was saved, but no AI response was generated.');
  assert.equal(getGenerationFailurePersistenceNotice(failed), 'The message was not saved and no AI response was generated.');
});

test('keeps guest messaging explicitly temporary', () => {
  const partial = { status: 'partial', userMessageSaved: true, assistantMessageSaved: false };
  assert.equal(
    getChatPersistenceNotice({ status: 'complete', userMessageSaved: true, assistantMessageSaved: true }, false),
    'Guest conversations are not saved. Sign in to keep your history.',
  );
  assert.equal(canRetryIncompleteExchange(partial, false), false);
});
