import axios from 'axios'
import { config } from 'dotenv'
import express from 'express'
import sql3 from 'sqlite3'

sql3.verbose();

// const sql3 = require('sqlite3').verbose();

config()
const app = express()

const TELEGRAM_URI = `https://api.telegram.org/bot${process.env.TELEGRAM_API_TOKEN}/sendMessage`

let sql
const db = new sql3.Database('./todo.db', sql3.OPEN_READWRITE, (err) => {
  if(err) return console.error(err.message);
})

// sql = `CREATE TABLE todos(id INTEGER PRIMARY KEY, name, datetime, isdone)`;
// db.run(sql)

// db.run('DROP TABLE todos');

// db.run(`INSERT INTO todos(name, datetime, isdone) VALUES (?, ?, ?)`,
//    ["Make something new", "21.08.2022", true],
//    (err) => {
//   if(err) return console.error(err.message);
// });

sql = `SELECT * FROM todos`;
db.all(sql, [], (err, rows) => {
  if(err) return console.error(err.message);
  rows.forEach(row => {
    console.log(row);
  })
});

app.use(express.json())
app.use(
  express.urlencoded({
    extended: true
  })
)

app.post('/new-message', async (req, res) => {
    const { message } = req.body
    const chatId = message?.chat?.id

    console.log(message)
    console.log(chatId)

    if (message.text == "Привет"||"Привет."||"/help"||"Приветики"||"Хай"||"Здарова"||"Здравствуйте"||"Добрый вечер"||"Hello"||"Hi"||"Приветики."||"Хай."||"Здарова."||"Здравствуйте."||"Добрый вечер."||"Hello."||"Hi.") {
      hello(chatId, res)
    }
    else {
      another(chatId, res)
    };
    
})

function hello(chatId, res){
  try {
    axios.post(TELEGRAM_URI, {
      chat_id: chatId,
      text: "Приветы!",
    })
    res.send('Done')
  }
  catch (e) {
    console.log(e)
    res.send(e)
  }
}

function another(chatId, res){
  try {
      for (let i=0;i<5;i++) {
        axios.post(TELEGRAM_URI, {
          chat_id: chatId,
          text: `Meow ${i}`,
        })
      }
      res.send('Done')
    }
    catch (e) {
      console.log(e)
      res.send(e)
    }
}

app.get('/', async (req, res) => {
    res.send("Hello! I am a bot, how can i help you?");
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})