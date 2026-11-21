export function createSubmissionId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function createChatSubmission(input) {
  return {
    ...input,
    submissionId: createSubmissionId(),
  };
}

export function createChatRetry(request, error) {
  return {
    ...request,
    conversationId: error.conversationId || request.conversationId,
  };
}
