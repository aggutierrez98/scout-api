import type { RamasType, RolesType } from '../../types'

export interface ScopingContext {
    scope: 'ALL' | 'RAMA' | 'FAMILIAR'
    rama?: RamasType | null
    familiarId?: string
}

const RAMA_ROLES: RolesType[] = ['AYUDANTE_RAMA', 'SUBJEFE_RAMA', 'JEFE_RAMA']
const FAMILIAR_ROLES: RolesType[] = ['PADRE_REPRESENTANTE']

export function buildScopingContext(user: {
    role: RolesType
    scout?: { rama?: RamasType | null } | null
    familiar?: { id: string } | null
}): ScopingContext {
    if (RAMA_ROLES.includes(user.role)) {
        return { scope: 'RAMA', rama: user.scout?.rama ?? null }
    }
    if (FAMILIAR_ROLES.includes(user.role)) {
        return { scope: 'FAMILIAR', familiarId: user.familiar?.id }
    }
    return { scope: 'ALL' }
}
