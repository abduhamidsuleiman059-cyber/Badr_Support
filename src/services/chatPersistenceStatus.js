export function getChatPersistenceNotice(persistence, isAuthenticated) {
  if (!isAuthenticated) {
    return 'Guest conversations are not saved. Sign in to keep your history.';
  }

  if (persistence?.status === 'complete'
    && persistence.userMessageSaved === true
    && persistence.assistantMessageSaved === true) {
    return 'Conversation saved to your account.';
  }
  if (persistence?.status === 'partial'
    && persistence.userMessageSaved === true
    && persistence.assistantMessageSaved === false) {
    return 'The reply arrived, but the complete exchange was not saved.';
  }
  if (persistence?.status === 'failed'
    && persistence.userMessageSaved === false
    && persistence.assistantMessageSaved === false) {
    return 'The reply arrived, but neither message was confirmed as saved.';
  }
  return 'The reply arrived, but the backend did not confirm that the complete exchange was saved.';
}

export function canRetryIncompleteExchange(persistence, isAuthenticated) {
  return Boolean(isAuthenticated && (
    (persistence?.status === 'partial'
      && persistence.userMessageSaved === true
      && persistence.assistantMessageSaved === false)
    || (persistence?.status === 'failed'
      && persistence.userMessageSaved === false
      && persistence.assistantMessageSaved === false)
  ));
}

export function getGenerationFailurePersistenceNotice(persistence) {
  if (persistence?.status === 'partial'
    && persistence.userMessageSaved === true
    && persistence.assistantMessageSaved === false) {
    return 'Your message was saved, but no AI response was generated.';
  }
  if (persistence?.status === 'failed'
    && persistence.userMessageSaved === false
    && persistence.assistantMessageSaved === false) {
    return 'The message was not saved and no AI response was generated.';
  }
  return '';
}
