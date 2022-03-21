"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Controller = void 0;

var _util = require("./util");

var _service = require("./service");

class Controller {
  constructor() {
    this.service = void 0;
    this.service = new _service.Service();
  }

  async getFileStream(filename) {
    return this.service.getFileStream(filename);
  }

  async handleCommand({
    command
  }) {
    _util.logger.info(`command received: ${command}`);

    const result = {
      result: 'ok'
    };
    const cmd = command.toLowerCase();

    if (cmd.includes('start')) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.service.startStreamming();
      return result;
    }

    if (cmd.includes('stop')) {
      this.service.stopStreamming();
      return result;
    }

    const chosenFx = await this.service.readFxByName(cmd);

    _util.logger.info(`added fx to service: ${chosenFx}`);

    this.service.appendFxStream(chosenFx);
    return result;
  }

  createClientStream() {
    const {
      id,
      clientStream
    } = this.service.createClientStream();

    const onClose = () => {
      _util.logger.info(`closing connection of ${id}`);

      this.service.removeClientStream(id);
    };

    return {
      stream: clientStream,
      onClose
    };
  }

}

exports.Controller = Controller;