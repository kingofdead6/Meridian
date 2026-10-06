import mongoose from 'mongoose';

let supported; // cached after first attempt

const isUnsupported = (err) =>
  err?.code === 20 || /Transaction numbers are only allowed|replica set|autocommit|txnNumber/i.test(err?.message || '');

/**
 * Runs fn(session) inside a MongoDB transaction. On a standalone server (no replica set)
 * it falls back to running without a session so local development still works.
 */
export async function runInTransaction(fn) {
  if (supported === false || process.env.MONGO_TRANSACTIONS === 'off') return fn(null);
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    supported = true;
    return result;
  } catch (err) {
    if (supported === undefined && isUnsupported(err)) {
      supported = false;
      console.warn('MongoDB transactions unavailable (standalone server). Running without them.');
      return fn(null);
    }
    throw err;
  } finally {
    await session.endSession();
  }
}
