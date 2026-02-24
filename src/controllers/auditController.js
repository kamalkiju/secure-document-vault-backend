/**
 * Audit controller: list logs for current user or by date range (admin).
 */

const auditService = require('../services/auditService');
const { success, error: errorResponse } = require('../utils/response');

async function listMine(req, res, next) {
  try {
    const { limit, offset } = req.query;
    const logs = auditService.getByActor(req.user.id, limit, offset);
    return success(res, { logs }, 'OK');
  } catch (e) {
    next(e);
  }
}

async function listByResource(req, res, next) {
  try {
    const { resourceType, resourceId } = req.params;
    const { limit, offset } = req.query;
    const logs = auditService.getByResource(resourceType, resourceId, limit, offset);
    return success(res, { logs }, 'OK');
  } catch (e) {
    next(e);
  }
}

async function listByDateRange(req, res, next) {
  try {
    const { startDate, endDate, limit, offset } = req.query;
    if (!startDate || !endDate) {
      return errorResponse(res, 'startDate and endDate required', 400);
    }
    const startStr = (startDate instanceof Date ? startDate : new Date(startDate)).toISOString();
    const endStr = (endDate instanceof Date ? endDate : new Date(endDate)).toISOString();
    const logs = auditService.getByDateRange(startStr, endStr, limit, offset);
    return success(res, { logs }, 'OK');
  } catch (e) {
    next(e);
  }
}

module.exports = { listMine, listByResource, listByDateRange };
