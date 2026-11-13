export class ServiceNotConfiguredError extends Error {
  constructor(service) {
    super(`${service} is not connected. Configure a backend before making requests.`);
    this.name = 'ServiceNotConfiguredError';
  }
}

export async function sendPrompt() {
  throw new ServiceNotConfiguredError('AI chat');
}

export async function getAvailableFeatures() {
  throw new ServiceNotConfiguredError('Feature catalogue');
}