"use strict";

var _util = require("./util");

var _server = _interopRequireDefault(require("./server"));

var _config = _interopRequireDefault(require("./config"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable @typescript-eslint/restrict-template-expressions */

/* eslint-disable @typescript-eslint/no-base-to-string */
_server.default.listen(_config.default.port).on('listening', () => _util.logger.info(`server running on port ${_config.default.port}`)); // impede que a aplicação caia, caso um erro não tratado aconteça!
// uncaughtException => throw
// unhandledRejection => Promises


process.on('uncaughtException', error => _util.logger.error(`uncaughtException happened: ${error?.stack ?? error}`));
process.on('unhandledRejection', error => _util.logger.error(`unhandledRejection happened: ${error}`));