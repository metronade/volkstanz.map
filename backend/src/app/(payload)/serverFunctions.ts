'use server'

import { handleServerFunctions } from '@payloadcms/next/layouts'

import configPromise from '@payload-config'
import importMap from './admin/importMap.js'

// Muss top-level + 'use server' sein — Payloads ServerFunctionsProvider
// durchtrennt die Client/Server-Grenze. Closures (wie inline Arrow-Functions
// im layout.tsx) werden beim Serialisieren zerstört und schlagen mit
// „Functions cannot be passed directly to Client Components" fehl.
export const serverFunction = async (name: string, args: Record<string, unknown>) =>
  handleServerFunctions({
    name,
    args,
    config: configPromise,
    importMap,
  })
