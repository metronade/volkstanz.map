import { NotFoundPage } from '@payloadcms/next/views'

import configPromise from '@payload-config'
import importMap from '../importMap.js'

const NotFound = () =>
  NotFoundPage({
    config: Promise.resolve(configPromise),
    importMap,
  })

export default NotFound
