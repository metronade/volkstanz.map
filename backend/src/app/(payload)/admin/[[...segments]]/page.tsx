/* eslint-disable @typescript-eslint/await-then-promise */
import { RootPage } from '@payloadcms/next/views'
import type { AdminViewProps } from 'payload'

import configPromise from '@payload-config'
import importMap from '../importMap.js'

const Page = ({ params, searchParams }: AdminViewProps) =>
  RootPage({
    config: Promise.resolve(configPromise),
    importMap,
    params,
    searchParams,
  })

export default Page
