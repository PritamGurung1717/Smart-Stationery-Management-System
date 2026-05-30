import { describe, expect, test, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { auth } from './auth.js';

vi.mock('../models/user.js', () => ({
  findOne: vi.fn(),
}));

describe('Auth Middleware', () => {
  test('returns 401 if no token provided', async () => {
    const req = {
      header: vi.fn().mockReturnValue(null),
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Access denied. No token provided.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 if token is "null" string', async () => {
    const req = {
      header: vi.fn().mockReturnValue('null'),
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
