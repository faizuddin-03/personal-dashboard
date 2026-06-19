import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      login: jest.fn(),
      refreshTokens: jest.fn(),
    } as any;

    const mockConfigService = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'JWT_REFRESH_TTL') return '1209600';
        return fallback;
      }),
    };

    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AuthController);
  });

  describe('POST /auth/login', () => {
    it('returns access token + sets refresh cookie on valid credentials', async () => {
      mockAuthService.login.mockResolvedValue({
        accessToken: 'access.jwt.token',
        refreshToken: 'refresh.jwt.token',
        user: { id: 'u1', email: 'admin@example.com', role: 'ADMIN' },
      });
      const res = { cookie: jest.fn() } as any;

      const result = await controller.login({ email: 'admin@example.com', password: 'hunter2' }, res);

      expect(result).toEqual({
        accessToken: 'access.jwt.token',
        user: { id: 'u1', email: 'admin@example.com', role: 'ADMIN' },
      });
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh.jwt.token',
        expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
      );
    });

    it('throws UnauthorizedException on bad credentials', async () => {
      mockAuthService.login.mockRejectedValue(new UnauthorizedException());
      const res = { cookie: jest.fn() } as any;

      await expect(
        controller.login({ email: 'admin@example.com', password: 'wrong' }, res),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('POST /auth/refresh', () => {
    it('issues new tokens when refresh cookie is valid', async () => {
      mockAuthService.refreshTokens = jest.fn().mockResolvedValue({
        accessToken: 'new.access',
        refreshToken: 'new.refresh',
        user: { id: 'u1', email: 'admin@example.com', role: 'ADMIN', name: null },
      });
      const req = { cookies: { refresh_token: 'old.refresh' } } as any;
      const res = { cookie: jest.fn() } as any;

      const result = await controller.refresh(req, res);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith('old.refresh');
      expect(result).toEqual({
        accessToken: 'new.access',
        user: { id: 'u1', email: 'admin@example.com', role: 'ADMIN', name: null },
      });
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'new.refresh',
        expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
      );
    });

    it('throws UnauthorizedException when no cookie present', async () => {
      const req = { cookies: {} } as any;
      const res = { cookie: jest.fn() } as any;
      await expect(controller.refresh(req, res)).rejects.toThrow(/missing refresh token/i);
    });

    it('throws UnauthorizedException when service rejects', async () => {
      const { UnauthorizedException } = require('@nestjs/common');
      mockAuthService.refreshTokens = jest.fn().mockRejectedValue(new UnauthorizedException());
      const req = { cookies: { refresh_token: 'bad' } } as any;
      const res = { cookie: jest.fn() } as any;
      await expect(controller.refresh(req, res)).rejects.toThrow();
    });
  });

  describe('POST /auth/logout', () => {
    it('clears the refresh cookie', async () => {
      const res = { clearCookie: jest.fn() } as any;
      await controller.logout(res);
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({ path: '/api/auth' }),
      );
    });

    it('returns success even when no cookie present (idempotent)', async () => {
      const res = { clearCookie: jest.fn() } as any;
      const result = await controller.logout(res);
      expect(result).toEqual({ ok: true });
    });
  });
});
