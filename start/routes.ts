/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
 

const AuthController = () => import('../app/controllers/auth_controller.js')
const DataController = () => import('../app/controllers/data_controller.js')
const SettingsController = () => import('../app/controllers/settings_controller.js')
const AuditsController = () => import('../app/controllers/audits_controller.js')


router.get('/', async () => {
  return {
    hello: 'world',
  }
})


/**
 * AUTH ROUTE GROUP.
 */
router.group(() => {
  router.get('/audit', [AuditsController, 'getAudits'])
  router.get('/dash/data', [DataController, 'getDashData'])
  router.get('/settings/get', [SettingsController, 'getSettings'])
  router.post('/settings/set', [SettingsController, 'setSettings'])
  router.get('/settings/presets', [SettingsController, 'getPresets'])
  router.post('/settings/preset/create', [SettingsController, 'createPreset'])
  router.post('/login', [AuthController, 'login'] )
})
.prefix('/api')
.use([middleware.auth()])


router.post('/api/auth/login', [AuthController, 'login'])