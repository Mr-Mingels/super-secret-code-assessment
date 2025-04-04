import { PlatformManager } from '@features'
import { injectApp } from './lib'
import { initialize } from './local-storage-sync'

export const initializeExtension = (manager: PlatformManager) => {
  injectApp()
  manager.init()
  initialize()
}
