export function getAuthCallbackCode(callbackUrl) {
  try {
    return new URL(callbackUrl).searchParams.get('code');
  } catch {
    return null;
  }
}

export function hasAuthCallbackError(callbackUrl) {
  try {
    const url = new URL(callbackUrl);
    return Boolean(url.searchParams.get('error') || url.searchParams.get('error_description'));
  } catch {
    return false;
  }
}

export async function exchangeAuthCallbackCode(client, callbackUrl) {
  if (hasAuthCallbackError(callbackUrl)) {
    throw new Error('The authentication provider did not complete sign-in.');
  }

  const code = getAuthCallbackCode(callbackUrl);
  if (!code) return null;

  const { data, error } = await client.auth.exchangeCodeForSession(code);
  if (error) {
    throw new Error('Unable to complete the authentication redirect.');
  }

  return data.session || null;
}
