import mongoose from 'mongoose'

let connected = false
let usingMemory = false

export async function connectDB() {
  if (connected) return
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI not set — comparison results stored in memory only')
    usingMemory = true
    return
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    connected = true
    console.log('MongoDB connected')
  } catch (err) {
    console.warn('MongoDB connection failed, falling back to memory:', err.message)
    usingMemory = true
  }
}

export function isUsingMemory() { return usingMemory }
export { mongoose }
