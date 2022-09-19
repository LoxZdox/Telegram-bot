import axios from 'axios'
import { config } from 'dotenv'
import express from 'express'
import sql3 from 'sqlite3'

sql3.verbose();

config()
const app = express()
const TELEGRAM_URI = `https://api.telegram.org/bot${process.env.TELEGRAM_API_TOKEN}/sendMessage`

const time_re1 = new RegExp(/\d{1,2}\/\d{1,2}\/\d{4}/); // for date like this  5/12/2020
const time_re2 = new RegExp(/\d{4}-\d{1,2}-\d{1,2}/); // for date like this 2020-05-12
const time_re3 = new RegExp(/\d{1,2}:\d{1,2}/); // for time like this 06:50

const db = new sql3.Database('./todo.db', sql3.OPEN_READWRITE, (err) => {
    if(err) return console.error(err.message);
})

app.use(express.json())
app.use(
  express.urlencoded({
    extended: true
  })  
)

app.post('/send-message', async () => {
    try {
        axios.post(TELEGRAM_URI, {
          chat_id: 399110541,
          text: "Hewwo! oOwOo \nI`m todo-bot",
        })
        console.log('meow')
      }
      catch (e) {
        console.log(e)
    }
})

app.get('/', async (req, res) => {
    res.send("Hello! I am a bot, how can i help you?");
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})