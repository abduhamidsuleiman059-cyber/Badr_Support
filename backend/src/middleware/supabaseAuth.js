const { HttpError } = require('./errorHandler');
const supabaseClient = require('../services/database/supabaseClient');
const { SupabaseNotConfiguredError } = require('../services/database/databaseErrors');

function authError(error) {
  const status = Number(error?.status);

  if ([400, 401, 403].includes(status)) {
    return new HttpError(401, 'A valid Supabase access token is required.');
  }

  return new HttpError(503, 'Authentication service is unavailable.');
}

function continueWithoutAuthentication(req, next) {
  req.authenticatedUser = null;
  console.warn('[Auth] Supabase verification unavailable; chat will continue without persistence.');
  return next();
}

function createSupabaseAuth({ required = false, getClient } = {}) {
  const clientProvider = getClient || (() => supabaseClient.getSupabaseClient());

  return async function authenticateSupabaseUser(req, res, next) {
    const authorization = req.get('authorization');

    if (!authorization) {
      if (required) {
        return next(new HttpError(401, 'Authentication is required.'));
      }

      req.authenticatedUser = null;
      return next();
    }

    const match = /^Bearer\s+([^\s]+)$/i.exec(authorization.trim());

    if (!match) {
      if (!required) {
        return continueWithoutAuthentication(req, next);
      }

      return next(new HttpError(401, 'A valid Supabase access token is required.'));
    }

    try {
      const { data, error } = await clientProvider().auth.getUser(match[1]);

      if (error) {
        if (!required) {
          return continueWithoutAuthentication(req, next);
        }

        return next(authError(error));
      }

      if (!data?.user?.id) {
        if (!required) {
          return continueWithoutAuthentication(req, next);
        }

        return next(new HttpError(401, 'A valid Supabase access token is required.'));
      }

      req.authenticatedUser = { id: data.user.id };
      return next();
    } catch (error) {
      if (error instanceof SupabaseNotConfiguredError) {
        if (!required) {
          return continueWithoutAuthentication(req, next);
        }

        return next(error);
      }

      if (!required) {
        return continueWithoutAuthentication(req, next);
      }

      return next(new HttpError(503, 'Authentication service is unavailable.'));
    }
  };
}

module.exports = {
  createSupabaseAuth,
  optionalSupabaseAuth: createSupabaseAuth(),
  requireSupabaseAuth: createSupabaseAuth({ required: true }),
};
