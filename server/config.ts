import { get } from 'env-var'
import { join } from 'path'

const currentDir = __dirname
const root = join(currentDir, '../')
const audioDirectory = join(root, 'audio')
const publicDirectory = join(root, 'public')

export default {
  port: get('PORT').default(3000).asPortNumber(),
  dir: {
    root,
    publicDirectory,
    audioDirectory,
    songsDirectory: join(audioDirectory, 'songs'),
    fxDirectory: join(audioDirectory, 'fx')
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
    }
  }
}
