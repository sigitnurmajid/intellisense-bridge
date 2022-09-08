import { schema, CustomMessages , rules} from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class DeviceInfoValidator {
  constructor(protected ctx: HttpContextContract) {}

  /*
   * Define schema to validate the "shape", "type", "formatting" and "integrity" of data.
   *
   * For example:
   * 1. The username must be of data type string. But then also, it should
   *    not contain special characters or numbers.
   *    ```
   *     schema.string({}, [ rules.alpha() ])
   *    ```
   *
   * 2. The email must be of data type string, formatted as a valid
   *    email. But also, not used by any other user.
   *    ```
   *     schema.string({}, [
   *       rules.email(),
   *       rules.unique({ table: 'users', column: 'email' }),
   *     ])
   *    ```
   */
  public schema = schema.create({
    device_id: schema.string(),
    data_type: schema.string([
      rules.equalTo('device_info')
    ]),
    data: schema.object().members({
      wakeup_time: schema.string(),
      temperature: schema.number(),
      humidity: schema.number(),
      solar_current: schema.number(),
      solar_voltage: schema.number(),
      solar_exposure: schema.number(),
      battery_current: schema.number(),
      battery_voltage: schema.number(),
      battery_level: schema.number(),
      memory_usage: schema.number(),
      firmware_version: schema.string(),
      hardware_version: schema.string(),
      device_type: schema.string(),
      timestamp: schema.string()
    }),
    published_at: schema.string()
  })

  /**
   * Custom messages for validation failures. You can make use of dot notation `(.)`
   * for targeting nested fields and array expressions `(*)` for targeting all
   * children of an array. For example:
   *
   * {
   *   'profile.username.required': 'Username is required',
   *   'scores.*.number': 'Define scores as valid numbers'
   * }
   *
   */
  public messages: CustomMessages = {}
}
