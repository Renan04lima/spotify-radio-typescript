"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Service = void 0;

var _config = _interopRequireDefault(require("./config"));

var _util = require("./util");

var _fs = require("fs");

var _promises = _interopRequireDefault(require("fs/promises"));

var _crypto = require("crypto");

var _stream = require("stream");

var _path = require("path");

var _child_process = _interopRequireDefault(require("child_process"));

var _throttle = _interopRequireDefault(require("throttle"));

var _promises2 = _interopRequireDefault(require("stream/promises"));

var _events = require("events");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  dir: {
    publicDirectory,
    fxDirectory
  },
  constants: {
    fallbackBitRate,
    englishConversation,
    bitRateDivisor,
    audioMediaType,
    songVolume,
    fxVolume
  }
} = _config.default;

class Service {
  constructor() {
    this.clientStreams = void 0;
    this.currentSong = void 0;
    this.currentBitRate = void 0;
    this.throttleTransform = void 0;
    this.currentReadable = void 0;
    this.clientStreams = new Map();
    this.currentSong = englishConversation;
    this.currentBitRate = 0;
    this.throttleTransform = {};
    this.currentReadable = {};
  }

  createClientStream() {
    const id = (0, _crypto.randomUUID)();
    const clientStream = new _stream.PassThrough();
    this.clientStreams.set(id, clientStream);
    return {
      id,
      clientStream
    };
  }

  removeClientStream(id) {
    this.clientStreams.delete(id);
  }

  createFileStream(filename) {
    return (0, _fs.createReadStream)(filename);
  }

  _executeSoxCommand(args) {
    return _child_process.default.spawn('sox', args);
  }

  async getBitRate(song) {
    try {
      const args = ['--i', // info
      '-B', // bitrate
      song];

      const {
        stderr,
        // tudo que é erro
        stdout // tudo que é log
        // stdin // enviar dados como stream

      } = this._executeSoxCommand(args);

      await Promise.all([(0, _events.once)(stderr, 'readable'), (0, _events.once)(stdout, 'readable')]);
      const [success, error] = [stdout, stderr].map(stream => stream.read());
      if (error != null) return await Promise.reject(error);
      return success.toString().trim().replace(/k/, '000');
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      _util.logger.error(`deu ruim no bitrate: ${error}`);

      return fallbackBitRate;
    }
  }

  broadCast() {
    return new _stream.Writable({
      write: (chunk, enc, cb) => {
        for (const [, stream] of this.clientStreams) {
          // if (stream.writableEnded != null) { // se o cliente desconectou não devemos mais mandar dados pra ele
          //   this.clientStreams.delete(id)
          //   continue
          // }
          stream.write(chunk);
        }

        cb();
      }
    });
  }

  async startStreamming() {
    _util.logger.info(`starting with ${this.currentSong}`);

    const bitRate = this.currentBitRate = parseFloat(await this.getBitRate(this.currentSong)) / bitRateDivisor;
    const throttleTransform = this.throttleTransform = new _throttle.default(bitRate);
    const songReadable = this.currentReadable = this.createFileStream(this.currentSong);
    return _promises2.default.pipeline(songReadable, throttleTransform, this.broadCast());
  }

  stopStreamming() {
    this.throttleTransform?.end?.();
  }

  async getFileInfo(file) {
    // file = home/index.html
    const fullFilePath = (0, _path.join)(publicDirectory, file); // valida se existe

    await _promises.default.access(fullFilePath);
    const fileType = (0, _path.extname)(fullFilePath);
    return {
      type: fileType,
      name: fullFilePath
    };
  }

  async getFileStream(file) {
    const {
      name,
      type
    } = await this.getFileInfo(file);
    return {
      stream: this.createFileStream(name),
      type
    };
  }

  async readFxByName(fxName) {
    const songs = await _promises.default.readdir(fxDirectory);
    const chosenSong = songs.find(filename => filename.toLowerCase().includes(fxName));
    if (chosenSong == null) return Promise.reject(new Error(`the song ${fxName} wasn't found!`));
    return (0, _path.join)(fxDirectory, chosenSong);
  }

  appendFxStream(fx) {
    const throttleTransformable = new _throttle.default(this.currentBitRate); // eslint-disable-next-line @typescript-eslint/no-floating-promises

    _promises2.default.pipeline(throttleTransformable, this.broadCast()); // avisa o client toda vez que chegar informação(aúdio) nova

    /**
     * faz o unlink, remoção do objeto
     * @returns void
     */


    const unpipe = () => {
      const transformStream = this.mergeAudioStreams(fx, this.currentReadable);
      this.throttleTransform = throttleTransformable;
      this.currentReadable = transformStream;
      this.currentReadable.removeListener('unpipe', unpipe); // evita vazamento de memória
      // eslint-disable-next-line @typescript-eslint/no-floating-promises

      _promises2.default.pipeline(transformStream, throttleTransformable);
    };

    this.throttleTransform.on('unpipe', unpipe);
    this.throttleTransform.pause(); // pausa a stream para pode manipular ela

    this.currentReadable.unpipe(this.throttleTransform);
  }

  mergeAudioStreams(song, readable) {
    // @ts-expect-error
    const transformStream = (0, _stream.PassThrough)();
    const args = ['-t', audioMediaType, '-v', songVolume, // '-m' => merge -> o '-' é para receber como stream
    '-m', '-', '-t', audioMediaType, '-v', fxVolume, song, '-t', audioMediaType, // '-' => saida no formato stream
    '-'];

    const {
      stdout,
      stdin
    } = this._executeSoxCommand(args); // plugamos a stream de conversacao na entrada de dados do terminal
    // eslint-disable-next-line @typescript-eslint/no-floating-promises


    _promises2.default.pipeline(readable, stdin); // .catch(error => logger.error(`error on sending stream to sox: ${error}`))
    // eslint-disable-next-line @typescript-eslint/no-floating-promises


    _promises2.default.pipeline(stdout, transformStream); // .catch(error => logger.error(`error on receiving stream from sox: ${error}`))


    return transformStream;
  }

}

exports.Service = Service;