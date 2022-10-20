import { Point } from '@influxdata/influxdb-client'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import PowerInfoValidator from 'App/Validators/PowerInfoValidator'
import Influx from '@ioc:Zhelda/Influx'

export default class PowerInfosController {
    public async store({ request, response }: HttpContextContract) {
        const payload = await request.validate(PowerInfoValidator)
        const point = new Point('power_info').tag('device_id', payload.device_id)
        const timestamp = new Date(payload.published_at)

        point.timestamp(timestamp)
        Object.entries(payload.data).forEach(([key, value]) => {
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
