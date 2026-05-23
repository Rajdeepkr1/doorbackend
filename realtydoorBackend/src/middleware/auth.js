const { createClerkClient } = require('@clerk/clerk-sdk-node');
const prisma = require('../lib/prisma');
const ApiError = require('../utils/ApiError');

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new ApiError(401, 'No token provided');

    // payload.role is populated when a Clerk JWT Template is configured:
    // Template body: { "role": "{{user.public_metadata.role}}" }
    // Without the template, role falls back to the DB value (safe default).
    const payload = await clerk.verifyToken(token);
    const clerkId = payload.sub;

    const dbUser = await prisma.user.findUnique({ where: { clerkId } });
    if (!dbUser) throw new ApiError(401, 'User not registered — call POST /api/auth/sync first');

    req.user = { ...dbUser, role: payload.role || dbUser.role };
    next();
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError(401, 'Invalid token'));
  }
}

module.exports = { authenticate };
