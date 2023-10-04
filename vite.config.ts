import { defineConfig } from 'vite'
import dotenv from 'dotenv'

dotenv.config() // load env vars from .env

export default defineConfig({
  define: {
    __VALUE__: `"${process.env.VALUE}"` // wrapping in "" since it's a string
  },
})