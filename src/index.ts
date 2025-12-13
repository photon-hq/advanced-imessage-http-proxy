import { createApp } from "./app"

// ------------------------------------------------------------------------------
// Entry Point
// ------------------------------------------------------------------------------

const PORT = Number(process.env.PORT) || 3000

const app = createApp()

app.listen(PORT, () => {
    console.log(`iMessage HTTP Proxy running on http://localhost:${PORT}`)
    console.log(`Swagger: http://localhost:${PORT}/swagger`)
})
