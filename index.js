import axios from 'axios'
import { config } from 'dotenv'
import express from 'express'

config()
const app = express()

const TELEGRAM_URI = `https://api.telegram.org/bot${process.env.TELEGRAM_API_TOKEN}/sendMessage`

app.use(express.json())
app.use(
  express.urlencoded({
    extended: true
  })
)

app.post('/new-message', async (req, res) => {
    const { message } = req.body
    const chatId = message?.chat?.id
    try {
        await axios.post(TELEGRAM_URI, {
          chat_id: chatId,
          text: message.text
        })
        res.send('Done')
      } catch (e) {
        console.log(e)
        res.send(e)
      }
})

app.get('/', async (req, res) => {
    res.send("Hello!");
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})