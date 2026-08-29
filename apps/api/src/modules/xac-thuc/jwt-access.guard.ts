import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export type RequestDaXacThuc = Request & {
  nguoiDungXacThuc?: {
    id: string;
  };
};

type JwtAccessPayload = {
  sub: string;
  loai: 'access';
};

@Injectable()
export class JwtAccessGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestDaXacThuc>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Thiếu access token.');
    }

    const token = authorization.slice('Bearer '.length).trim();

    try {
      const payload = await this.jwtService.verifyAsync<JwtAccessPayload>(token, {
        secret: this.layAccessSecret(),
      });

      if (payload.loai !== 'access' || !payload.sub) {
        throw new UnauthorizedException('Access token không hợp lệ.');
      }

      request.nguoiDungXacThuc = {
        id: payload.sub,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Access token không hợp lệ hoặc đã hết hạn.');
    }
  }

  private layAccessSecret(): string {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');

    if (secret) {
      return secret;
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Production thiếu JWT_ACCESS_SECRET.');
    }

    return 'agrimarket-local-access-secret-change-before-production-012';
  }
}
