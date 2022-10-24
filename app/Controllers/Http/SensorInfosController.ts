import { Point } from '@influxdata/influxdb-client'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import SensorInfoValidator from 'App/Validators/Sensor/SensorInfoValidator'
import Influx from '@ioc:Zhelda/Influx'
import QuerySensorLastValidator from 'App/Validators/Sensor/QuerySensorLastValidator'
import Env from '@ioc:Adonis/Core/Env'
import QuerySensorHistoryValidator from 'App/Validators/Sensor/QuerySensorHistoryValidator'

export default class SensorInfosController {
  public async store({ request, response }: HttpContextContract) {
    const payload = await request.validate(SensorInfoValidator)
    const timestamp = new Date(payload.timestamp)

    // filter sensor data
    const pointsFiltered = payload.data.filter(value => { return value.name !== undefined })

    const points = pointsFiltered.map(x => {
      const point = new Point(x.name!).tag('device_id', payload.device_id)
      point.timestamp(timestamp)
      Object.entries(x).forEach(([key, value]) => {
        switch (typeof value) {
          case 'string':
            point.stringField(key, value)
            break
          case 'number':
            Number.isInteger(value) ? point.intField(key, value) : point.floatField(key, value)
            break
        }
      })

      return point
    })

    try {
      await Influx.writePoints(points)
      return response.ok({ status: 'success', message: 'Saved' })
    } catch (error) {
      throw Error(error.message)
    }
  }

  public async last({ request, response }: HttpContextContract) {
    const query = await request.validate(QuerySensorLastValidator)
    const bucket = Env.get('INFLUX_BUCKET', '')
    const measurement = this.buildMeasurements(query.measurement)

    const flux = `from(bucket: "${bucket}")
      |> range(start: -30d)
      |> filter(fn: (r) => ${measurement} )
      |> filter(fn: (r) => r["device_id"] == "${query.device_id}" )
      |> last()
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> group(columns: ["_measurement"])
      |> drop(columns: ["_start", "_stop"])
    `
    try {
      const result = await Influx.readPoints(flux)
      const obj = {}
      result.forEach((element: any) => {
        delete element.result
        delete element.table
        obj[element._measurement] = element
      })
      return response.ok({ status: 'success', data: obj })
    } catch (error) {
      throw Error(error.message)
    }
  }

  public async history({ request, response }: HttpContextContract) {
    const query = await request.validate(QuerySensorHistoryValidator)
    const bucket = Env.get('INFLUX_BUCKET', '')
    const measurement = this.buildMeasurements(query.measurement)

    const flux = `from(bucket: "${bucket}")
      |> range(start: ${query.start}, stop: ${query.end})
      |> filter(fn: (r) => ${measurement} )
      |> filter(fn: (r) => r["device_id"] == "${query.device_id}" )
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> group(columns: ["_measurement"])
      |> drop(columns: ["_start", "_stop"])
    `

    try {
      const result = await Influx.readPoints(flux)
      const groupByCategory = result.reduce((group: any, measurement: any) => {
        delete measurement.table
        delete measurement.result
        const { _measurement } = measurement
        group[_measurement] = group[_measurement] ?? []
        group[_measurement].push(measurement)
        return group
      }, {})
      return response.ok({ status: 'success', data: groupByCategory })
    } catch (error) {
      throw Error(error.message)
    }
  }


  private buildMeasurements(measurements: Array<string>) {
    const measurementsFlux = measurements.map(x => {
      return 'r["_measurement"] == ' + '"' + x + '"'
    })

    return measurementsFlux.join(' or ')
  }

  /**
  private buildTags(tags: Array<string>) {
    const tagsFlux = tags.map(x => {
      return 'r["device_id"] == ' + '"' + x + '"'
    })

    return tagsFlux.join(' or ')
  }
    */

}
