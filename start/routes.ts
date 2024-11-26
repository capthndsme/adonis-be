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
const UsersController = () => import('../app/controllers/users_controller.js')


router.get('/', async () => {
  return {
    hello: 'world'
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
  router.delete('/settings/preset/:id', [SettingsController, 'deleteSetting'])
  router.get('/users/me', [UsersController, 'getMe'])

  router.post('/login', [AuthController, 'login'] )
  router.post('/users/create', [UsersController, 'createUser'])
  router.put('/users/modify', [UsersController, 'modifyUser'])
  router.delete('/users/delete/:id', [UsersController, 'deleteUser'])
  router.get('/users/list', [UsersController, 'listUsers'])

  
})
.prefix('/api')
.use([middleware.auth()])


router.post('/api/auth/login', [AuthController, 'login'])