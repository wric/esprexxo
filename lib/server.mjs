import http from 'http'
import { marax } from './marax.mjs'
import { pump } from './pump.mjs'
import { insert, insertMaraxSql, insertPumpSql } from './store.mjs'
import { HTTP_PORT, MARAX_SERIAL, PUMP_PIN } from './utils/env.mjs'

const clients = { marax: [], pump: [] }

const getSlug = request => request.url.toLowerCase()

const requestListener = (request, response) => {
  const slug = getSlug(request)

  if (slug === '/events') {
    return resEvents(response)
  }

  if (slug === '/events/marax') {
    return addEventSubscription(request, response, 'marax')
  }

  if (slug === '/events/pump') {
    return addEventSubscription(request, response, 'pump')
  }

  return res404(response)
}

const addEventSubscription = (request, response, subscription) => {
  response.writeHead(200, {
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*'
  })

  const client = {
    id: Date.now(),
    response
  }

  clients[subscription].push(client)

  request.on('close', () => {
    console.log(`${client.id} connection closed.`)
    clients[subscription] = clients[subscription].filter(
      c => c.id !== client.id
    )
  })
}

const resEvents = response => {
  response.writeHead(200, { 'Content-Type': 'application/json' })
  response.write(
    JSON.stringify({
      maraxCients: clients.marax.length,
      pumpCients: clients.pump.length
    })
  )
  response.end()
}

const res404 = response => {
  response.writeHead(404)
  response.end()
}

const sendEvent = (clients, data) => {
  const json = JSON.stringify(data)
  clients.forEach(client => client.response.write(json + '\n\n'))
}

const main = () => {
  marax(MARAX_SERIAL).on('data', data => {
    insert(insertMaraxSql, data)
    sendEvent(clients.marax, data)
  })

  pump(PUMP_PIN).on('data', data => {
    insert(insertPumpSql, data)
    sendEvent(clients.pump, data)
  })

  http.createServer(requestListener).listen(HTTP_PORT, () => {
    console.log(`>>> Server running at http://127.0.0.1:${HTTP_PORT}/`)
  })
}

main()
