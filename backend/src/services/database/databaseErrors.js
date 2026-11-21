class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('Supabase is not configured.');
    this.name = 'SupabaseNotConfiguredError';
    this.statusCode = 503;
    this.publicMessage = 'Conversation storage is not configured.';
  }
}

class DatabaseOperationError extends Error {
  constructor(operation) {
    super(`Supabase ${operation} failed.`);
    this.name = 'DatabaseOperationError';
    this.operation = operation;
    this.statusCode = 503;
    this.publicMessage = 'Conversation storage is unavailable.';
  }
}

class ConversationNotFoundError extends Error {
  constructor() {
    super('Conversation was not found for the authenticated user.');
    this.name = 'ConversationNotFoundError';
    this.statusCode = 404;
    this.publicMessage = 'Conversation not found.';
  }
}

class IdempotencyConflictError extends Error {
  constructor() {
    super('The idempotency key was already used with different message content.');
    this.name = 'IdempotencyConflictError';
    this.statusCode = 409;
    this.publicMessage = 'This submission ID has already been used for a different message.';
  }
}

module.exports = {
  SupabaseNotConfiguredError,
  DatabaseOperationError,
  ConversationNotFoundError,
  IdempotencyConflictError,
};
