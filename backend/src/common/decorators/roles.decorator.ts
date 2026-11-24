import { SetMetadata } from '@nestjs/common';

// Declara los roles permitidos en una ruta (ver RolesGuard).
// Roles válidos del sistema: 'admin' y 'cliente'.
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
