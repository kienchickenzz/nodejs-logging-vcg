import express from 'express'
import { Request, Response, NextFunction } from 'express'
import http from 'http'
import { createLogger, format, transports } from 'winston'

import { requestLoggerMiddleware } from './middleware/requestLogger'

const app = express()

app.use(requestLoggerMiddleware)

const start = () => {
    http.createServer( app ).listen( 3000, () => {
        console.info( 'Server is running on port 3000' )
    } )
}

start()
