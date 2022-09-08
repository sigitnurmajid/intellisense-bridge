import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class GeoInfoValidator {
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
      rules.equalTo('geo_info')
    ]),
    data: schema.object().members({
      utc_time: schema.string(),
      latitude: schema.string(),
      ns_indicator : schema.string(),
      longitude: schema.string(),
      ew_indicator: schema.string(),
      position_fix_indicator: schema.number(),
      satellites_used: schema.number(),
      horizontal_dilution_of_precision: schema.number(),
      altitude: schema.number(),
      altitude_unit: schema.string(),
      geoidal_separation: schema.number(),
      geoidal_separation_unit: schema.string(),
      age_of_Diff_Corr: schema.string(), // not yet fix
      sampling_tofix_time: schema.number(), // not yet fix
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
