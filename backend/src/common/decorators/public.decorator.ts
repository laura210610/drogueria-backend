import { SetMetadata } from '@nestjs/common';

// Marca una ruta como pública: el JwtAuthGuard global no exige token.
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
