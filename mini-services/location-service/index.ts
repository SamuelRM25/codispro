import { Server } from 'socket.io'
import { createServer } from 'http'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PORT = 3001

const httpServer = createServer()

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// Store active connections
const activeUsers = new Map<string, { userId: string; vehicleId?: string }>()
const activeLocations = new Map<string, { latitude: number; longitude: number; timestamp: Date }>()

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  socket.on('location:update', async (data: {
    userId: string
    vehicleId?: string
    latitude: number
    longitude: number
    accuracy?: number
  }) => {
    try {
      const { userId, vehicleId, latitude, longitude, accuracy } = data

      // Store in database
      await prisma.locationLog.create({
        data: {
          userId,
          vehicleId,
          latitude,
          longitude,
          accuracy,
          timestamp: new Date(),
          createdAt: new Date()
        }
      })

      // Update active location
      activeLocations.set(userId, {
        latitude,
        longitude,
        timestamp: new Date()
      })

      // Track active user
      activeUsers.set(socket.id, { userId, vehicleId })

      // Broadcast to all connected clients
      io.emit('location:broadcast', {
        userId,
        vehicleId,
        latitude,
        longitude,
        accuracy,
        timestamp: new Date().toISOString()
      })

      console.log(`Location updated for user ${userId}: ${latitude}, ${longitude}`)
    } catch (error) {
      console.error('Error saving location:', error)
      socket.emit('error', { message: 'Error saving location' })
    }
  })

  socket.on('location:history', async (data: { userId?: string; vehicleId?: string; limit?: number }) => {
    try {
      const { userId, vehicleId, limit = 50 } = data

      const where: any = {}
      if (userId) where.userId = userId
      if (vehicleId) where.vehicleId = vehicleId

      const history = await prisma.locationLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit
      })

      socket.emit('location:history', history)
    } catch (error) {
      console.error('Error fetching location history:', error)
      socket.emit('error', { message: 'Error fetching history' })
    }
  })

  socket.on('location:active', () => {
    const activeData = Array.from(activeLocations.entries()).map(([userId, location]) => ({
      userId,
      ...location
    }))

    socket.emit('location:active', activeData)
  })

  socket.on('disconnect', () => {
    const userData = activeUsers.get(socket.id)
    if (userData) {
      activeUsers.delete(socket.id)
      activeLocations.delete(userData.userId)
      console.log(`Client disconnected: ${socket.id}, User: ${userData.userId}`)
    }
  })
})

// Clean up old location logs periodically (keep only last 7 days)
setInterval(async () => {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const deleted = await prisma.locationLog.deleteMany({
      where: {
        timestamp: {
          lt: sevenDaysAgo
        }
      }
    })

    console.log(`Cleaned up ${deleted.count} old location logs`)
  } catch (error) {
    console.error('Error cleaning up location logs:', error)
  }
}, 24 * 60 * 60 * 1000) // Run daily

httpServer.listen(PORT, () => {
  console.log(`Location service running on port ${PORT}`)
})
