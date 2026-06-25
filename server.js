require('dotenv').config()

const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())
const ADMIN_PASSWORD = 'GMS2026'

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: '*',
    },
})

let auction = {
    title: 'Volkswagen Jetta',

    currentBid: 220000,

    lastUser: 'Старт',

    history: [],

    status: 'waiting',

    winner: null,

    startTime: null,

    endTime: null,
}

app.post('/admin/start', (req, res) => {
    const {
        password,
        days,
        hours,
        minutes,
        startPrice,
    } = req.body

    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({
            message: 'Wrong password',
        })
    }

    const duration =
        Number(days || 0) *
            24 *
            60 *
            60 *
            1000 +
        Number(hours || 0) *
            60 *
            60 *
            1000 +
        Number(minutes || 0) *
            60 *
            1000

    const now = Date.now()

    auction.currentBid =
    Number(startPrice) || 220000

auction.lastUser = 'Старт'
auction.history = []

    auction.status = 'active'

    auction.startTime = now

    auction.endTime = now + duration

    auction.winner = null

    io.emit('auction_update', auction)

    res.json({
        success: true,
        message: 'Auction started',
    })
})

app.post('/admin/finish', (req, res) => {
    const { password } = req.body

    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({
            message: 'Wrong password',
        })
    }

    auction.status = 'finished'

    auction.winner = {
        user: auction.lastUser,
        amount: auction.currentBid,
    }

    io.emit('auction_update', auction)

    res.json({
        success: true,
        message: 'Auction finished',
    })
})

app.post('/admin/reset', (req, res) => {
    const { password } = req.body

    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({
            message: 'Wrong password',
        })
    }

    auction = {
        title: 'Volkswagen Jetta',

        currentBid: 220000,

        lastUser: 'Старт',

        history: [],

        status: 'waiting',

        winner: null,

        startTime: null,

        endTime: null,
    }

    io.emit('auction_update', auction)

    res.json({
        success: true,
        message: 'Auction reset',
    })
})

setInterval(() => {
    if (
        auction.status === 'active' &&
        auction.endTime &&
        Date.now() >= auction.endTime
    ) {
        auction.status = 'finished'

        auction.winner = {
            user: auction.lastUser,
            amount: auction.currentBid,
        }

        io.emit('auction_update', auction)
    }
}, 1000)

io.on('connection', (socket) => {
    console.log('User connected')

    socket.emit('auction_update', auction)

    socket.on('place_bid', ({ user, amount }) => {
        if (auction.status !== 'active') {
            return
        }

        if (amount >= auction.currentBid + 4000) {
            auction.currentBid = amount

            auction.lastUser = user

            auction.history.unshift({
                user,
                amount,
                time: new Date().toLocaleTimeString(),
            })

            const secondsLeft =
                (auction.endTime - Date.now()) /
                1000

            if (secondsLeft <= 3) {
                auction.endTime =
                    Date.now() + 10000
            }

            io.emit('auction_update', auction)
        }
    })
})

server.listen(5000, () => {
    console.log(
        'Server started on port 5000'
    )
})