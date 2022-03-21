"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _routes = require("./routes");

var _http = require("http");

/* eslint-disable @typescript-eslint/no-misused-promises */
var _default = (0, _http.createServer)(_routes.handler);

exports.default = _default;