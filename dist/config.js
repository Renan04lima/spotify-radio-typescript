"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _envVar = require("env-var");

var _path = require("path");

const currentDir = __dirname;
const root = (0, _path.join)(currentDir, '../');
const audioDirectory = (0, _path.join)(root, 'audio');
const publicDirectory = (0, _path.join)(root, 'public');
const songsDirectory = (0, _path.join)(audioDirectory, 'songs');
const config = {
  port: (0, _envVar.get)('PORT').default(3000).asPortNumber(),
  dir: {
    root,
    publicDirectory,
    audioDirectory,
    songsDirectory: (0, _path.join)(audioDirectory, 'songs'),
    fxDirectory: (0, _path.join)(audioDirectory, 'fx')
  },
  pages: {
    homeHTML: 'home/index.html',
    controllerHTML: 'controller/index.html'
  },
  location: {
    home: '/home'
  },
  constants: {
    CONTENT_TYPE: {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript'
    },
    audioMediaType: 'mp3',
    songVolume: '0.99',
    fxVolume: '0.1',
    fallbackBitRate: '128000',
    bitRateDivisor: 8,
    englishConversation: (0, _path.join)(songsDirectory, 'conversation.mp3')
  }
};
var _default = config;
exports.default = _default;