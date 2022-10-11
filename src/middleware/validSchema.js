const Ajv = require('ajv'), ajv = new Ajv()

/**
 * Validates the input with a json schema to prevent invalid data to pass to the endpoint
 *
 * @param {json} schema - The json schema to use for validation
 * @param {array<string>} [whatToValidate] - An array of strings, indicating which part of req.* is going to be validated, like body, params, headers, query, defaults to body
 * @returns {(function(*, *, *): Promise<*|undefined>)|*}
 */
const validSchema = (schema, whatToValidate) => async (req, res, next) => {
  try {
    if (!schema) return res.status(500).json({ success: false, message: 'Invalid validation file' }).end()
    let inputData
    if (typeof whatToValidate === 'undefined')
      inputData = req.body
    else
      whatToValidate.forEach(item => inputData = { ...inputData, ...req[item] })
    if (!ajv.validate(schema, inputData)) return res.status(400).json({
      success: false,
      message: 'Invalid input received'
    }).end()
    next()
  } catch (err) {
    console.error("ERROR IN SCHEMA VALIDATION", err.message || err)
    return res.status(500).end()
  }
}
module.exports = { validSchema }
