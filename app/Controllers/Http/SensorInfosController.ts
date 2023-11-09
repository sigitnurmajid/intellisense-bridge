import { Point } from '@influxdata/influxdb-client'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import SensorInfoValidator from 'App/Validators/Sensor/SensorInfoValidator'
import Influx from '@ioc:Zhelda/Influx'
import QuerySensorLastValidator from 'App/Validators/Sensor/QuerySensorLastValidator'
import Env from '@ioc:Adonis/Core/Env'
import QuerySensorHistoryValidator from 'App/Validators/Sensor/QuerySensorHistoryValidator'

export default class SensorInfosController {
  public async store({ params, request, response }: HttpContextContract) {
    const payload = await request.validate(SensorInfoValidator)
    const sensor = params.sensor
    const point = new Point(sensor).tag('device_id', payload.device_id)
    const timestamp = new Date(parseInt(payload.timestamp) * 1000)
    const dataJson = JSON.parse(payload.data)

    point.timestamp(timestamp)
    Object.entries(dataJson).forEach(([key, value]) => {
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

  public async last({ request, response }: HttpContextContract) {
    const query = await request.validate(QuerySensorLastValidator)
    const bucket = Env.get('INFLUX_BUCKET', '')
    const measurement = this.buildMeasurements(query.measurement)
    const deviceId = request.params().deviceId

    const flux = `from(bucket: "${bucket}")
      |> range(start: -30d)
      |> filter(fn: (r) => ${measurement} )
      |> filter(fn: (r) => r["device_id"] == "${deviceId}" )
      |> last()
      |> filter(fn: (r) => r["_field"] != "L14" )
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
    const deviceId = request.params().deviceId

    const flux = `from(bucket: "${bucket}")
      |> range(start: ${query.start}, stop: ${query.end})
      |> filter(fn: (r) => ${measurement} )
      |> filter(fn: (r) => r["device_id"] == "${deviceId}" )
      |> filter(fn: (r) => r["_field"] != "L14" )
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
