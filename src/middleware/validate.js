/**
 * Joi validation middleware. Validates req.body, req.query, req.params.
 * Rejects malformed or unexpected fields. Standard error response.
 */

const { error: errorResponse } = require('../utils/response');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = req[source] || {};
    const { error: err, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (err) {
      const message = err.details.map((d) => d.message).join('; ');
      return errorResponse(res, message, 400, { validation: err.details });
    }
    req[source] = value;
    next();
  };
}

module.exports = validate;
