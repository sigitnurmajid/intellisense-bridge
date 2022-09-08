declare module '@ioc:Zhelda/Influx' {
  import { ReportNode } from '@ioc:Adonis/Lucid/Database'
  import { Point } from '@influxdata/influxdb-client'

  function writePoints(points: Array<Point | undefined>): Promise<void>
  function readPoints(fluxQuery: string): Promise<unknown[]>
  function report(): Promise<ReportNode>
  function writePoint(point: Point): Promise<void>
}
