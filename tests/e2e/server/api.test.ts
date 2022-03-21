import Server from '../../../server/server'
import config from '../../../server/config'
import superTest, { SuperTest, Test } from 'supertest'
import fs from 'fs'
import portfinder from 'portfinder'
import { Transform, Writable } from 'stream'
import {
  setTimeout
} from 'timers/promises'
const getAvailablePort = portfinder.getPortPromise
const RETENTION_DATA_PERIOD = 200

const {
  dir: {
    publicDirectory
  },
  pages: {
    homeHTML,
    controllerHTML
  }
} = config

describe('API E2E Suite Test', () => {
  const testServer = superTest(Server())
  const commandResponse = JSON.stringify({
    result: 'ok'
  })
  const possibleCommands = {
    start: 'start',
    stop: 'stop'
  }

  function pipeAndReadStreamData (stream: Test, onChunk: (x: any) => void): Writable {
    const transform = new Transform({
      transform (chunk, enc, cb) {
        onChunk(chunk)

        cb(null, chunk)
      }
    })
    return stream.pipe(transform)
  }

  test('GET /unknown - given an unknown route it should respond with 404 status code', async () => {
    const response = await testServer.get('/unknown')
    expect(response.statusCode).toStrictEqual(404)
  })

  test('GET / - it should respond with the home location and 302 status code', async () => {
    const response = await testServer.get('/')
    expect(response.headers.location).toStrictEqual('/home')
    expect(response.statusCode).toStrictEqual(302)
  })

  test('GET /home - it should respond with file stream', async () => {
    const response = await testServer.get('/home')
    const homePage = await fs.promises.readFile(`${publicDirectory}/${homeHTML}`)
    expect(response.text).toStrictEqual(homePage.toString())
  })

  test('GET /controller - it should respond with file stream', async () => {
    const response = await testServer.get('/controller')
    const homePage = await fs.promises.readFile(`${publicDirectory}/${controllerHTML}`)
    expect(response.text).toStrictEqual(homePage.toString())
  })

  describe('static files', () => {
    test('GET /file.js - it should respond with 404 if file doesnt exists', async () => {
      const file = 'file.js'
      const response = await testServer.get(`/${file}`)
      expect(response.statusCode).toStrictEqual(404)
    })

    test('GET /controller/css/index.css - given a css file it should respond with content-type text/css ', async () => {
      const file = 'controller/css/index.css'
      const response = await testServer.get(`/${file}`)
      const existingPage = await fs.promises.readFile(`${publicDirectory}/${file}`)
      expect(response.text).toStrictEqual(existingPage.toString())
      expect(response.statusCode).toStrictEqual(200)
      expect(response.header['content-type']).toStrictEqual('text/css')
    })

    test('GET /home/js/animation.js - given a js file it should respond with content-type text/javascript ', async () => {
      const file = 'home/js/animation.js'
      const response = await testServer.get(`/${file}`)
      const existingPage = await fs.promises.readFile(`${publicDirectory}/${file}`)
      expect(response.text).toStrictEqual(existingPage.toString())
      expect(response.statusCode).toStrictEqual(200)
      expect(response.header['content-type']).toStrictEqual('text/javascript')
    })

    test('GET /controller/index.html - given a html file it should respond with content-type text/html ', async () => {
      const file = controllerHTML
      const response = await testServer.get(`/${file}`)
      const existingPage = await fs.promises.readFile(`${publicDirectory}/${file}`)
      expect(response.text).toStrictEqual(existingPage.toString())
      expect(response.statusCode).toStrictEqual(200)
      expect(response.header['content-type']).toStrictEqual('text/html')
    })
  })

  describe('client workflow', () => {
    async function getTestServer (): Promise<{ testServer: SuperTest<Test>, kill: () => void }> {
      const getSupertTest = (port: number) => superTest(`http://localhost:${port}`)
      const port = await getAvailablePort()
      return new Promise((resolve, reject) => {
        const server = Server().listen(port)
          .once('listening', () => {
            const testServer = getSupertTest(port)
            const response = {
              testServer,
              kill () {
                server.close()
              }
            }

            return resolve(response)
          })
          .once('error', reject)
      })
    }

    function commandSender (testServer: SuperTest<Test>): { send: (command: string) => Promise<void> } {
      return {
        async send (command: string) {
          const response = await testServer.post('/controller')
            .send({
              command
            })

          expect(response.text).toStrictEqual(commandResponse)
        }
      }
    }
    test('it should not receive data stream if the process is not playing', async () => {
      const server = await getTestServer()
      const onChunk = jest.fn()
      pipeAndReadStreamData(
        server.testServer.get('/stream'),
        onChunk
      )
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      await setTimeout(RETENTION_DATA_PERIOD)
      server.kill()
      expect(onChunk).not.toHaveBeenCalled()
    })
    test('it should receive data stream if the process is playing', async () => {
      const server = await getTestServer()
      const onChunk = jest.fn()
      const {
        send
      } = commandSender(server.testServer)
      pipeAndReadStreamData(
        server.testServer.get('/stream'),
        onChunk
      )

      await send(possibleCommands.start)
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      await setTimeout(RETENTION_DATA_PERIOD)
      await send(possibleCommands.stop)
      const [
        [buffer]
      ] = onChunk.mock.calls
      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(1000)

      server.kill()
    })
  })
})
