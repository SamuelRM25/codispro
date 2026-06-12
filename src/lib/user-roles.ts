export const USER_ROLES = [
  'ADMIN',
  'MANAGER',
  'WORKER',
  'BODEGA',
  'VEHICULO',
  'RECEPTOR',
] as const

export type UserRoleValue = (typeof USER_ROLES)[number]
