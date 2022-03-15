import server from './server'

server.listen(3000).on('listening', () => console.log('server running'))
