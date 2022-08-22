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



// db.run(`UPDATE todos SET name = ? WHERE id = ?`, ['Meowy', 1], (err) => {
//   if(err) return console.error(err.message);
// })

// db.run(`DELETE FROM todos WHERE id = ?`, [5], (err) => {
//   if(err) return console.error(err.message);
// })

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

    //("Привет"||"Привет."||"/help"||"Приветики"||"Хай"||"Здарова"||"Здравствуйте"||"Добрый вечер"||"Hello"||"Hi"||"Приветики."||"Хай."||"Здарова."||"Здравствуйте."||"Добрый вечер."||"Hello."||"Hi.")
    if (message.text == "Hello") {
      hello(chatId, res);
      help(chatId, res);
    }
    else if (message.text == "/show_todos"){
      show_todos(chatId, res);
    }
    else{
      another(chatId, res)
    };
    
})

function hello(chatId, res){
  try {
    axios.post(TELEGRAM_URI, {
      chat_id: chatId,
      text: "Hewwo! oOwOo",
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
      axios.post(TELEGRAM_URI, {
        chat_id: chatId,
        text: "I don`t really know what to say, so: ",
      })
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

function help(chatId, res){
  try{
      axios.post(TELEGRAM_URI, {
        chat_id:chatId,
        text: 'Here`s some commands for you: '+
        '\n1. Use /show_todos if you want to get full list.'+
        '\n2. Use /add_todo for adding a new item into your list' +
        '\n3. Use /edit_todo for editing'+
        '\n4. Use /complete_todo for completing'+
        '\n5 Use /delete_todo for deleting'+
        'Woow that`s a simple menu. xd'
      })
    }
  catch (e) {
    console.log(e)
    res.send(e)
  }
}

function show_todos(chatId, res){
  try{
    sql = `SELECT * FROM todos`;
    db.all(sql, [], (err, rows) => {
    if(err) return console.error(err.message);
      rows.forEach(row => {
        if (row.isdone == '0')
        axios.post(TELEGRAM_URI, {
          chat_id: chatId,
          text: `${row.id} ${row.name} ${row.datetime} is done: ❌`,
        })
        else{
          axios.post(TELEGRAM_URI, {
            chat_id: chatId,
            text: `${row.id} ${row.name} ${row.datetime} is done: ✅`,
          })
        }
        console.log(row);
      })
    });
  }
  catch(e){}
}
function add_todo(chatId, res){
  try{}
  catch(e){}
}
function edit_todo(chatId, res){
  try{}
  catch(e){}
}
function complete_todo(chatId, res){
  try{}
  catch(e){}
}
function delete_todo(chatId, res){
  try{}
  catch(e){}
}

app.get('/', async (req, res) => {
    res.send("Hello! I am a bot, how can i help you?");
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})