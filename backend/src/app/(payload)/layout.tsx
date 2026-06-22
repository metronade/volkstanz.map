import type { ServerComponentProps } from '@payloadcms/next'
import { RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

import '@payloadcms/next/css'

import configPromise from '@payload-config'
import importMap from './admin/importMap.js'
import { serverFunction } from './serverFunctions'

type Args = {
  children: React.ReactNode
} & ServerComponentProps

const Layout = ({ children }: Args) => (
  <RootLayout
    config={configPromise as any}
    importMap={importMap}
    serverFunction={serverFunction}
  >
    {children}
  </RootLayout>
)

export default Layout
