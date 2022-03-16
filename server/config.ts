import { get } from 'env-var'
import { join } from 'path'

const currentDir = __dirname
const root = join(currentDir, '../')
const audioDirectory = join(root, 'audio')
const publicDirectory = join(root, 'public')

type Config = {
  port: number
  dir: {
    root: string
    publicDirectory: string
    audioDirectory: string
    songsDirectory: string
    fxDirectory: string
  }
  pages: {
    homeHTML: string
    controllerHTML: string
  }
  location: {
    home: string
  }
  constants: {
    CONTENT_TYPE: {
      [key: string]: string
    }
  }

}

const config: Config = {
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

export default config
