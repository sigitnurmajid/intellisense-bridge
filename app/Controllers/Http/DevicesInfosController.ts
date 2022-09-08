import { Point } from '@influxdata/influxdb-client'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import DeviceInfoValidator from 'App/Validators/DeviceInfoValidator'
import Influx from '@ioc:Zhelda/Influx'

export default class DevicesInfosController {
  public async store({ request ,response}: HttpContextContract) {
    const payload = await request.validate(DeviceInfoValidator)
    const point = new Point(payload.data_type).tag('device_id', payload.device_id)

    Object.entries(payload.data).forEach(([key, value]) => {
      if (key === 'timestamp') return point.timestamp(new Date(value))
      switch (typeof value) {
        case 'string':
          point.stringField(key, value)
          break
        case 'number':
          Number.isInteger(value) ? point.intField(key, value) : point.floatField(key, value)
          break
      }
    })

    try {
      await Influx.writePoint(point)
      return response.ok({ status: 'success', message: 'Saved' })
    } catch (error) {
      throw Error(error.message)
    }
  }
}
