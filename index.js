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
let state
let todo_text
let todo_datetime
const db = new sql3.Database('./todo.db', sql3.OPEN_READWRITE, (err) => {
  if(err) return console.error(err.message);
})

// sql = `CREATE TABLE todos(id INTEGER PRIMARY KEY, name, datetime, isdone)`;
// db.run(sql)
// db.run('DROP TABLE todos');




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

    if (message.text == "Hello") {
      hello(chatId, res);
      help(chatId, res);
    }
    else if (message.text == "/show_todos"){
      show_todos(chatId, res);
    }
    else if ((message.text == "/add_todo")||(state=="adding_name")||(state=="adding_datetime")){
      add_todo(chatId, res, message);
    }
    else if ((message.text == "/complete_todo")||(state=="compliting_todo")){
      complete_todo(chatId, res, message);
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
        if(row == 'null'){
          axios.post(TELEGRAM_URI, {
            chat_id: chatId,
            text: "You don`t have any todos yet! You can make some through /add_todo",
          })
        }
        else if (row.isdone == '0'){
          axios.post(TELEGRAM_URI, {
            chat_id: chatId,
            text: `${row.id} ___ ${row.name} ___ ${row.datetime} ___ is done: ❌`,
          })
        }
        else{
          axios.post(TELEGRAM_URI, {
            chat_id: chatId,
            text: `${row.id} ___ ${row.name} ___ ${row.datetime} ___ is done: ✅`,
          })
        } 
        console.log(row);
      })
      res.send('Done')
    });
  }
  catch(e){
    console.log(e)
    res.send(e)
  }
}

function add_todo(chatId, res, message){
  try{
    if((state!="adding_name")&&(state!="adding_datetime")){
      axios.post(TELEGRAM_URI, {
        chat_id:chatId,
        text: 'Please write the description or name of your todo: '
      })
      state = "adding_name"
    }
    else if(state=="adding_name"){
      todo_text = message.text
      axios.post(TELEGRAM_URI, {
        chat_id:chatId,
        text: 'And datetime is ..?'
      })
      state = "adding_datetime"
    }
    else if(state=="adding_datetime"){
      todo_datetime = message.text
      db.run(`INSERT INTO todos(name, datetime, isdone) VALUES (?, ?, ?)`,
      [ todo_text, todo_datetime , false],
      (err) => {
        if(err) return console.error(err.message);
      });
      axios.post(TELEGRAM_URI, {
        chat_id:chatId,
        text: `Here's your new todo: \n${todo_text} ___ ${todo_datetime} ___ is done: ❌`
      })
      state = null;
      todo_text = null;
      todo_datetime = null;
    }
    res.send('Done')
  }
  catch(e){
    console.log(e)
    res.send(e)
  }
}

function complete_todo(chatId, res, message){
  // TODO: for tomorrow or else
  // if i type /complete_todo 5 then i should complete todo 5
  try{
    if(state!="compliting_todo"){
      axios.post(TELEGRAM_URI, {
        chat_id:chatId,
        text: "Please write the id of your todo "
      });
      state = "compliting_todo"
    }
    else if(state=="compliting_todo"){
        db.run(`UPDATE todos SET isdone = ? WHERE id = ?`, [true, message.text], (err) => {
        if(err) return console.error(err.message);
      });
      db.all(`SELECT * FROM todos WHERE id = ?`, [message.text], (err, rows) => {
        if(err) return console.error(err.message);
        axios.post(TELEGRAM_URI, {
          chat_id:chatId,
          text: `${rows[0].name} ___ ${rows[0].datetime} __ is done: ✅`
        });
      })
    }
    res.send('Done');
  }
  catch(e){
    console.log(e)
    res.send(e)
  }
}
function edit_todo(chatId, res){
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