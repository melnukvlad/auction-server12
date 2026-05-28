const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()

app.use(cors())

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: '*',
    },
})

let auction = {
    title: 'Toyota Camry',
    currentBid: 200000,
    lastUser: 'Старт',
    history: [],
}

io.on('connection', (socket) => {
    console.log('User connected')

    socket.emit('auction_update', auction)

    socket.on('place_bid', ({ user, amount }) => {
        if (amount > auction.currentBid) {
            auction.currentBid = amount
            auction.lastUser = user

            auction.history.unshift({
                user,
                amount,
                time: new Date().toLocaleTimeString(),
            })

            io.emit('auction_update', auction)
        }
    })
})

server.listen(5000, () => {
    console.log('Server started on port 5000')
})