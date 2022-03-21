"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.logger = void 0;

var _pino = _interopRequireDefault(require("pino"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = (0, _pino.default)({
  enabled: process.env.LOG_DISABLE == null,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});
const logger = log;
exports.logger = logger;