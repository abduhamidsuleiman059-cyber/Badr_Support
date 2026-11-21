export function getThreadsForIdentity(threads, userId) {
  const identity = userId || null;
  return threads.filter((thread) => (thread.ownerUserId || null) === identity);
}

export function getActiveThreadIdForIdentity(activeThreadId, threads, userId, savedConversations = []) {
  const identityThreads = getThreadsForIdentity(threads, userId);
  if (identityThreads.some((thread) => thread.id === activeThreadId)) {
    return activeThreadId;
  }

  return savedConversations[0]?.id || null;
}

export function canApplyAuthResult(requestUserId, requestGeneration, currentUserId, currentGeneration) {
  return requestUserId === currentUserId && requestGeneration === currentGeneration;
}

export function canApplyInitialSession(initialAuthEventVersion, currentAuthEventVersion) {
  return initialAuthEventVersion === currentAuthEventVersion;
}
