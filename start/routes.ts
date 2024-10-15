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

router.get('/', async () => {
  return {
    hello: 'world',
  }
})


/**
 * AUTH ROUTE GROUP.
 */
router.group(() => {

})
.use(middleware.auth)


router.post('/api/login', () => false)