/**
 * Joi schemas for all inputs. Reject unexpected fields, enforce limits.
 */

const Joi = require('joi');

const email = Joi.string().email().max(255).required();
const password = Joi.string().min(8).max(128).required();
const role = Joi.string().valid('admin', 'member', 'viewer');
const pagination = {
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0),
};

const auth = {
  register: Joi.object({
    email,
    password,
    role: role.default('member'),
  }),
  login: Joi.object({
    email,
    password,
  }),
};

const folder = {
  create: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    parentId: Joi.string().uuid().allow(null),
  }),
  update: Joi.object({
    name: Joi.string().min(1).max(255).required(),
  }),
  list: Joi.object({
    ...pagination,
  }),
};

const document = {
  list: Joi.object({
    folderId: Joi.string().uuid().allow(null),
    ...pagination,
  }),
  share: Joi.object({
    granteeId: Joi.string().uuid().required(),
    permission: Joi.string().valid('view', 'download').required(),
  }),
  revokeShare: Joi.object({
    shareId: Joi.string().uuid().required(),
  }),
};

const audit = {
  list: Joi.object({
    ...pagination,
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
  }),
  export: Joi.object({
    ...pagination,
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().required(),
  }),
};

module.exports = {
  auth,
  folder,
  document,
  audit,
  pagination,
};
