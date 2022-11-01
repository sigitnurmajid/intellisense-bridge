/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import HealthCheck from '@ioc:Adonis/Core/HealthCheck'
import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async () => {
  return 'Hello world from a slim app'
}).middleware('auth')

Route.group(() => {
  Route.group(() => {
    Route.post('device-info', 'DevicesInfosController.store').middleware('auth')
    Route.post('geo-info', 'GeoInfosController.store').middleware('auth')
    Route.post('sensor-info/:sensor', 'SensorInfosController.store').middleware('auth')
    Route.post('power-info', 'PowerInfosController.store').middleware('auth')
    Route.post('online-info', 'OnlineInfosController.store').middleware('auth')
    Route.get('intellisense/:deviceId/last', 'SensorInfosController.last').middleware('auth')
    Route.get('intellisense/:deviceId/history', 'SensorInfosController.history').middleware('auth')
  }).prefix('/v1')
}).prefix('/api')

Route.get('health', async ({ response }) => {
  const report = await HealthCheck.getReport()

  return report.healthy
    ? response.ok(report)
    : response.badRequest(report)
})
