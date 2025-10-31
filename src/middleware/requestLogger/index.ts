import { NextFunction, Request, Response } from 'express'
import { createLogger, transports, format } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import * as path from 'path'

const { combine, timestamp, printf, errors } = format

const logDir = path.join( __dirname, '../../../logs' )
const exclude_routes: string[] = [
    // '/api/health',
]
const exclude_prefixes: string[] = [
    // '/static/',
    // '/assets/',
]
const include_prefixes: string[] = [
    // '/api/'
]

const getRequestEmoji = (method: string) => {
    const requetsEmojis: Record<string, string> = {
        GET: '⬇️',
        POST: '⬆️',
        PUT: '🖊',
        DELETE: '❌',
        OPTION: '🔗'
    }

    return requetsEmojis[method] || '?'
}

const shouldLogRequest = (url: string): boolean => {
    // Check if URL should be excluded
    if ( exclude_routes.includes(url)) {
        return false
    }

    // Check if URL starts with excluded prefix
    const hasExcludedPrefix = exclude_prefixes.some(prefix => 
        url.startsWith(prefix)
    )
    if (hasExcludedPrefix) {
        return false
    }

    // Check if URL starts with included prefix
    const hasIncludedPrefix = include_prefixes.some(prefix => 
        url.startsWith(prefix)
    )
    if (include_prefixes.length > 0 && !hasIncludedPrefix) {
        return false
    }

    return true
}

const logger = createLogger({
    format: combine( 
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), 
        format.json(), 
        errors({ stack: true }) 
    ),
    transports: [
        new transports.Console({
            level: process.env.LOG_LEVEL ?? 'debug'
        }),
        new DailyRotateFile({
            filename: path.join(logDir, 'server-%DATE%.log'),
            datePattern: 'YYYY-MM-DD-HH',
            maxSize: '20m',
            level: process.env.LOG_LEVEL ?? 'debug'
        })
    ]
})

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (!shouldLogRequest(req.url)) {
        return next()
    }

    const message = `${getRequestEmoji(req.method)} ${req.method} ${req.url}`

    const logMeta = {
        request: {
            method: req.method,
            url: req.url,
            body: req.body,
            query: req.query,
            params: req.params,
            headers: req.headers,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        }
    }

    logger.info(message, logMeta)

    next()
}
