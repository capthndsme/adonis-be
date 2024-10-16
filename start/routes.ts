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


router.get('/', async () => {
  return {
    hello: 'world',
  }
})


/**
 * AUTH ROUTE GROUP.
 */
router.group(() => {
  router.get('/dash/data', [DataController, 'getDashData'])
})
.prefix('/api')
.use([middleware.auth()])


router.post('/api/auth/login', [AuthController, 'login'])