import { Point } from '@influxdata/influxdb-client'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import OnlineInfoValidator from "App/Validators/OnlineInfoValidator"
import Influx from '@ioc:Zhelda/Influx'

export default class OnlineInfosController {
    public async store({ request, response }: HttpContextContract) {
        const payload = await request.validate(OnlineInfoValidator)
        const point = new Point('online_info')
            .tag('device_id', payload.device_id)
            .stringField('status', payload.data)
            .timestamp(new Date(payload.published_at))

        try {
            await Influx.writePoint(point)
            return response.ok({ status: 'success', message: 'Saved' })
        } catch (error) {
            throw Error(error.message)
        }
    }
}
