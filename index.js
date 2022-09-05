import axios from 'axios'
import { config } from 'dotenv'
import express from 'express'
import sql3 from 'sqlite3'

sql3.verbose();

config()
const app = express()
const TELEGRAM_URI = `https://api.telegram.org/bot${process.env.TELEGRAM_API_TOKEN}/sendMessage`
const edit_re = new RegExp(/\/edit_todo* \d+/);
const complete_re = new RegExp(/\/complete_todo* \d+/);
const delete_re = new RegExp(/\/delete_todo* \d+/);

let sql
let state = null
let todo_id
let todo_text
let todo_datetime
let user_state = {}
const db = new sql3.Database('./todo.db', sql3.OPEN_READWRITE, (err) => {
  if(err) return console.error(err.message);
})

// sql = `CREATE TABLE todos(id INTEGER PRIMARY KEY, name, datetime, isdone, user_id)`;
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
    if(!user_state.hasOwnProperty(chatId)){
      user_state[chatId] = {state: "default", todo_text: null, todo_datetime: null, todo_id: null}
    }
    // console.log(message)
    // console.log(req.body.message.from.id)
    // console.log(chatId)
    // console.log(chatId)
    // console.log(state)
    else{
      console.log('ChatId: ')
      console.log(user_state[chatId]["state"])
      console.log(', user: ')
    }
    if (message.text == "/start") {
      hello(chatId, res);
    }
    else if (message.text == "/show_todos"){
      show_todos(chatId, res);
    }
    else if ((message.text == "/add_todo")||(user_state[chatId].state =="adding_name")||(user_state[chatId].state =="adding_datetime")){
      add_todo(chatId, res, message, req);
    }
    else if ((message.text == "/edit_todo")||(user_state[chatId].state == "choosing_id")||(user_state[chatId].state == "editing_name")||
    (user_state[chatId].state == "editing_datetime")||
    ((edit_re.test(message.text) == true)&&(complete_re.test(message.text) == false)&&(delete_re.test(message.text) == false))){
      edit_todo(chatId, res, message);
    }
    else if ((message.text == "/complete_todo")||(user_state[chatId].state == "compliting_todo")||
    ((complete_re.test(message.text) == true)&&(edit_re.test(message.text) == false)&&(delete_re.test(message.text) == false))){
      complete_todo(chatId, res, message);
    }
    else if ((message.text == "/delete_todo")||(user_state[chatId].state == "deleting_todo")||
    ((delete_re.test(message.text) == true)&&(edit_re.test(message.text) == false)&&(complete_re.test(message.text) == false))){
      delete_todo(chatId, res, message);
    }
    else{
      another(chatId, res)
    };
})

function hello(chatId, res){
  try {
    axios.post(TELEGRAM_URI, {
      chat_id: chatId,
      text: "Hewwo! oOwOo \nI`m todo-bot",
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

function show_todos(chatId, res){
  try{
    db.all(`SELECT * FROM todos WHERE user_id = ?`, [chatId], (err, rows) => {
    if(err) return console.error(err.message);
    if(rows[0] == null){
      axios.post(TELEGRAM_URI, {
        chat_id: chatId,
        text: "You don`t have any todos yet! You can make some through /add_todo",
      })
    }
    else{
      rows.forEach(row => {
        if (row.isdone == '0'){
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
      })
    }
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
    if((user_state[chatId].state!="adding_name")&&(user_state[chatId].state!="adding_datetime")){
      axios.post(TELEGRAM_URI, {
        chat_id:chatId,
        text: 'Please write the description or name of your todo: '
      })
      user_state[chatId].state = "adding_name"
    }
    else if(user_state[chatId].state =="adding_name"){
      user_state[chatId].todo_text = message.text
      axios.post(TELEGRAM_URI, {
        chat_id:chatId,
        text: 'And datetime is ..?'
      })
      user_state[chatId].state = "adding_datetime"
    }
    else if(user_state[chatId].state=="adding_datetime"){
      user_state[chatId].todo_datetime = message.text
      db.run(`INSERT INTO todos(name, datetime, isdone, user_id) VALUES (?, ?, ?, ?)`,
      [user_state[chatId].todo_text, user_state[chatId].todo_datetime , false, chatId],
      (err) => {
        if(err) return console.error(err.message);
      });
      axios.post(TELEGRAM_URI, {
        chat_id:chatId,
        text: `Here's your new todo: \n${user_state[chatId].todo_text} ___ ${user_state[chatId].todo_datetime} ___ is done: ❌`
      })
      user_state[chatId].state = "default";
      console.log(user_state[chatId]);
      user_state[chatId].todo_text = null;
      user_state[chatId].todo_datetime = null;
      user_state[chatId].todo_id = null;
    }
    res.send('Done')
  }
  catch(e){
    console.log(e)
    res.send(e)
  }
}

function complete_todo(chatId, res, message){
  try{
    if(complete_re.test(message.text)==true){
      db.all(`SELECT * FROM todos WHERE id = ? AND user_id = ?`, [message.text.replace(/\/complete_todo* /, ""), chatId], (err, rows) => {
        if(err) return console.error(err.message);
        if(typeof(rows[0])==="undefined"){
          axios.post(TELEGRAM_URI, {
            chat_id:chatId,
            text: 'Sorry, this todo doesn`t exist, try another one'
          });
        }
        else{
          db.run(`UPDATE todos SET isdone = ? WHERE id = ?`, [true, message.text.replace(/\/complete_todo* /, "")], (err) => {
            if(err) return console.error(err.message);
          });
          db.all(`SELECT * FROM todos WHERE id = ?`, [message.text.replace(/\/complete_todo* /, "")], (err, rows) => {
          if(err) return console.error(err.message);
            axios.post(TELEGRAM_URI, {
              chat_id:chatId,
              text: `${rows[0].name} ___ ${rows[0].datetime} __ is done: ✅`
            });
            user_state[chatId].state = "default";
          })
        }
      })
    }
    else if((user_state[chatId].state!="compliting_todo")&&(complete_re.test(message.text)!=true)){
      axios.post(TELEGRAM_URI, {
        chat_id:chatId,
        text: "Please write the id of your todo "
      });
      user_state[chatId].state = "compliting_todo"
    }
    else if(user_state[chatId].state=="compliting_todo"){
        if(isNaN(message.text) == true){
          axios.post(TELEGRAM_URI, {
            chat_id:chatId,
            text: `it is not an id, please write an id`
          });
        }
        else if(isNaN(message.text) == false){
          db.all(`SELECT * FROM todos WHERE id = ? AND user_id = ?`, [message.text, chatId], (err, rows) => {
            if(err) return console.error(err.message);
            if(typeof(rows[0])==="undefined"){
              axios.post(TELEGRAM_URI, {
                chat_id:chatId,
                text: 'Sorry, this todo is deleted or doesn`t exist yet, try another one'
              });
            }
            else{
              db.run(`UPDATE todos SET isdone = ? WHERE id = ?`, [true, message.text], (err) => {
                if(err) return console.error(err.message);
              });
              db.all(`SELECT * FROM todos WHERE id = ?`, [message.text], (err, rows) => {
              if(err) return console.error(err.message);
                axios.post(TELEGRAM_URI, {
                  chat_id:chatId,
                  text: `${rows[0].name} ___ ${rows[0].datetime} __ is done: ✅`
                });
                user_state[chatId].state = null;
              })
            }
          })
        }  
    }
    res.send('Done');
  }
  catch(e){
    console.log(e)
    res.send(e)
  }
}

function edit_todo(chatId, res, message){
  try{
    if(edit_re.test(message.text)==true){
      db.all(`SELECT * FROM todos WHERE id = ? AND user_id = ?`, [message.text.replace(/\/edit_todo* /, ""), chatId], (err, rows) => {
        if(err) return console.error(err.message);
        if(typeof(rows[0])==="undefined"){
          axios.post(TELEGRAM_URI, {
            chat_id:chatId,
            text: 'Sorry, this todo doesn`t exist, try another one'
          });
        }
        else{ 
          user_state[chatId].todo_id = message.text.replace(/\/edit_todo* /, "");
          axios.post(TELEGRAM_URI, {
            chat_id:chatId,
            text: "Please write the new name!"
          });
          user_state[chatId].state = "editing_name"
        }
      })
    }
    else if((user_state[chatId].state !="choosing_id")&&(user_state[chatId].state != "editing_name")&&(user_state[chatId].state != "editing_datetime")){
      axios.post(TELEGRAM_URI, {
        chat_id:chatId,
        text: "Please write the id of your todo "
      });
      user_state[chatId].state = "choosing_id"
    }
    else if(user_state[chatId].state == "choosing_id"){
      if(isNaN(message.text) == true){
        axios.post(TELEGRAM_URI, {
          chat_id:chatId,
          text: `it is not an id, please write an id`
        });
      }
      else if(isNaN(message.text) == false){
        db.all(`SELECT * FROM todos WHERE id = ? AND user_id = ?`, [message.text, chatId], (err, rows) => {
          if(err) return console.error(err.message);
          if(typeof(rows[0])==="undefined"){
            axios.post(TELEGRAM_URI, {
              chat_id:chatId,
              text: 'Sorry, this todo doesn`t exist, try another one'
            });
          }
          else{
            user_state[chatId].todo_id = message.text;
            axios.post(TELEGRAM_URI, {
              chat_id:chatId,
              text: "Please write the new name!"
            });
            user_state[chatId].state = "editing_name"
          }
        })
      }
    }
    else if(user_state[chatId].state =="editing_name"){
      user_state[chatId].todo_text = message.text;
      axios.post(TELEGRAM_URI, {
        chat_id:chatId,
        text: "Please write the new datetime!"
      });
      user_state[chatId].state = "editing_datetime"
    }
    else if(user_state[chatId].state =="editing_datetime"){
      user_state[chatId].todo_datetime = message.text;
      db.run(`UPDATE todos SET name = ?, datetime = ? WHERE id = ?`, [user_state[chatId].todo_text, user_state[chatId].todo_datetime, user_state[chatId].todo_id], (err) => {
      if(err) return console.error(err.message);
      });
      axios.post(TELEGRAM_URI, {
        chat_id:chatId,
        text: "Your todo has been updated!"
      });
      user_state[chatId].state = null;
      user_state[chatId].todo_text = null;
      user_state[chatId].todo_datetime = null;
      user_state[chatId].todo_id = null;
    }
    res.send('Done');
  }
  catch(e){
    console.log(e)
    res.send(e)
  }
}

function delete_todo(chatId, res, message){
  try{
    if(delete_re.test(message.text)==true){
      db.all(`SELECT * FROM todos WHERE id = ? AND user_id = ?`, [message.text.replace(/\/delete_todo* /, ""), chatId], (err, rows) => {
        if(err) return console.error(err.message);
        if(typeof(rows[0])==="undefined"){
          axios.post(TELEGRAM_URI, {
            chat_id:chatId,
            text: 'Sorry, this todo is already deleted or doesn`t exist, try another one'
          });
        }
        else{ 
          db.run(`DELETE FROM todos WHERE id = ?`, [message.text.replace(/\/delete_todo* /, "")], (err) => {
            if(err) return console.error(err.message);
            axios.post(TELEGRAM_URI, {
              chat_id:chatId,
              text: `Your todo has been deleted`
            });
          });
          state = null;
        }
      })
    }
    else if(state!="deleting_todo"){
      axios.post(TELEGRAM_URI, {
        chat_id:chatId,
        text: "Please write the id of your todo "
      });
      state = "deleting_todo"
    }
    else if(state == "deleting_todo"){
      if(isNaN(message.text) == true){
        axios.post(TELEGRAM_URI, {
          chat_id:chatId,
          text: `it is not an id, please write an id`
        });
      }
      else if(isNaN(message.text) == false){
        db.all(`SELECT * FROM todos WHERE id = ? AND user_id = ?`, [message.text, chatId], (err, rows) => {
          if(err) return console.error(err.message);
          if(typeof(rows[0])==="undefined"){
            axios.post(TELEGRAM_URI, {
              chat_id:chatId,
              text: 'Sorry, this todo is already deleted or doesn`t exist, try another one'
            });
          }
          else{
            db.run(`DELETE FROM todos WHERE id = ?`, [message.text], (err) => {
              if(err) return console.error(err.message);
              axios.post(TELEGRAM_URI, {
                chat_id:chatId,
                text: `Your todo has been deleted`
              });
            });
            state = null;
          }
        })
      }   
    }
    res.send('Done')
  }
  catch(e){}
}

app.get('/', async (req, res) => {
    res.send("Hello! I am a bot, how can i help you?");
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})