/* eslint-disable @typescript-eslint/restrict-plus-operands */
import config from './config'
import { Controller } from './controller'
import { logger } from './util'

import { IncomingMessage, ServerResponse } from 'http'
import { once } from 'events'

const {
  location,
  pages: {
    homeHTML,
    controllerHTML
  },
  constants: {
    CONTENT_TYPE
  }
} = config

const controller = new Controller()

async function routes (request: IncomingMessage, response: ServerResponse): Promise<ServerResponse> {
  const { method, url } = request

  if (method === 'GET' && url === '/') {
    response.writeHead(302, {
      Location: location.home
    })

    return response.end()
  }

  if (method === 'GET' && url === '/home') {
    const {
      stream
    } = await controller.getFileStream(homeHTML)

    // padrão do response é text/html
    //  response.writeHead(200, {
    //    'Content-Type': 'text/html'
    // })
    return stream.pipe(response)
  }

  if (method === 'GET' && url === '/controller') {
    const {
      stream
    } = await controller.getFileStream(controllerHTML)

    // padrão do response é text/html
    return stream.pipe(response)
  }

  if (method === 'GET' && ((url?.includes('/stream')) ?? false)) {
    const {
      stream,
      onClose
    } = controller.createClientStream()
    request.once('close', onClose)
    response.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes'
    })

    return stream.pipe(response)
  }

  if (method === 'POST' && url === '/controller') {
    const data = await once(request, 'data') as unknown as string
    const item = JSON.parse(data)
    const result = await controller.handleCommand(item)
    return response.end(JSON.stringify(result))
  }

  // files
  if (method === 'GET') {
    if (url === undefined) {
      response.writeHead(400)
      return response.end()
    }

    const fileStream = await controller.getFileStream(url)

    const { stream, type } = fileStream

    const contentType = CONTENT_TYPE[type]
    if (contentType != null) {
      response.writeHead(200, {
        'Content-Type': CONTENT_TYPE[type]
      })
    }
    return stream.pipe(response)
  }

  response.writeHead(404)
  return response.end()
}

function handleError (error: Error, response: ServerResponse): ServerResponse {
  if (error.message.includes('ENOENT')) {
    logger.warn('assert not found' + error?.stack)
    response.writeHead(404)
    return response.end()
  }

  logger.error('caught error on API' + error?.stack)
  response.writeHead(500)
  return response.end()
}
export async function handler (request: IncomingMessage, response: ServerResponse): Promise<ServerResponse> {
  return routes(request, response)
    .catch(error => handleError(error, response))
}
