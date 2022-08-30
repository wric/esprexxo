import http from 'http'
import { marax } from './marax.mjs'
import { pump } from './pump.mjs'
import { insert, insertMaraxSql, insertPumpSql } from './store.mjs'
import { HTTP_PORT, MARAX_SERIAL, PUMP_PIN } from './utils/env.mjs'

let maraxCients = []
let pumpCients = []

const getSlug = request => request.url.toLowerCase()

const requestListener = (request, response) => {
  const slug = getSlug(request)

  if (slug === '/events') {
    return resEvents(response)
  }

  if (slug === '/events/marax') {
    if (request.method === 'OPTIONS') {
      response.writeHead(204, corsHeaders)
      response.end()
      return
    }
    return addEventSubscription(request, response, maraxCients)
  }

  if (slug === '/events/pump') {
    if (request.method === 'OPTIONS') {
      response.writeHead(204, corsHeaders)
      response.end()
      return
    }
    return addEventSubscription(request, response, pumpCients)
  }

  return res404(response)
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*' /* @dev First, read about security */,
  'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
  'Access-Control-Max-Age': 2592000 // 30 days
  /** add other headers as per requirement */
}

const addEventSubscription = (request, response, clients) => {
  response.writeHead(200, {
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Request-Method': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, GET',
    'Access-Control-Allow-Headers': '*'
  })

  const client = {
    id: Date.now(),
    response
  }

  clients.push(client)

  request.on('close', () => {
    console.log(`${client.id} connection closed.`)
    clients = clients.filter(c => c.id !== client.id)
  })
}

const resEvents = response => {
  response.writeHead(200, { 'Content-Type': 'application/json' })
  response.write(
    JSON.stringify({
      maraxCients: maraxCients.length,
      pumpCients: pumpCients.length
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
    sendEvent(maraxCients, data)
  })

  pump(PUMP_PIN).on('data', data => {
    insert(insertPumpSql, data)
    sendEvent(pumpCients, data)
  })

  http.createServer(requestListener).listen(HTTP_PORT, () => {
    console.log(`>>> Server running at http://127.0.0.1:${HTTP_PORT}/`)
  })
}

main()
