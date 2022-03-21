"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.handler = handler;

var _config = _interopRequireDefault(require("./config"));

var _controller = require("./controller");

var _util = require("./util");

var _events = require("events");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable @typescript-eslint/restrict-plus-operands */
const {
  location,
  pages: {
    homeHTML,
    controllerHTML
  },
  constants: {
    CONTENT_TYPE
  }
} = _config.default;
const controller = new _controller.Controller();

async function routes(request, response) {
  const {
    method,
    url
  } = request;

  if (method === 'GET' && url === '/') {
    response.writeHead(302, {
      Location: location.home
    });
    return response.end();
  }

  if (method === 'GET' && url === '/home') {
    const {
      stream
    } = await controller.getFileStream(homeHTML); // padrão do response é text/html
    //  response.writeHead(200, {
    //    'Content-Type': 'text/html'
    // })

    return stream.pipe(response);
  }

  if (method === 'GET' && url === '/controller') {
    const {
      stream
    } = await controller.getFileStream(controllerHTML); // padrão do response é text/html

    return stream.pipe(response);
  }

  if (method === 'GET' && (url?.includes('/stream') ?? false)) {
    const {
      stream,
      onClose
    } = controller.createClientStream();
    request.once('close', onClose);
    response.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Accept-Rages': 'bytes'
    });
    return stream.pipe(response);
  }

  if (method === 'POST' && url === '/controller') {
    const data = await (0, _events.once)(request, 'data');
    const item = JSON.parse(data);
    const result = await controller.handleCommand(item);
    return response.end(JSON.stringify(result));
  } // files


  if (method === 'GET') {
    if (url === undefined) {
      response.writeHead(400);
      return response.end();
    }

    const fileStream = await controller.getFileStream(url);
    const {
      stream,
      type
    } = fileStream;
    const contentType = CONTENT_TYPE[type];

    if (contentType != null) {
      response.writeHead(200, {
        'Content-Type': CONTENT_TYPE[type]
      });
    }

    return stream.pipe(response);
  }

  response.writeHead(404);
  return response.end();
}

function handleError(error, response) {
  if (error.message.includes('ENOENT')) {
    _util.logger.warn('assert not found' + error?.stack);

    response.writeHead(404);
    return response.end();
  }

  _util.logger.error('caught error on API' + error?.stack);

  response.writeHead(500);
  return response.end();
}

async function handler(request, response) {
  return routes(request, response).catch(error => handleError(error, response));
}