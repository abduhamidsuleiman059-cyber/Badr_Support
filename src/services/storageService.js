import { ServiceNotConfiguredError } from './aiService';

export async function getCurrentUser() {
  throw new ServiceNotConfiguredError('User profile');
}

export async function signIn() {
  throw new ServiceNotConfiguredError('Authentication');
}

export async function signInWithGoogle() {
  throw new ServiceNotConfiguredError('Google authentication');
}

export async function register() {
  throw new ServiceNotConfiguredError('Authentication');
}