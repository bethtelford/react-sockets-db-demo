require("dotenv").config();
const express = require("express"),
  bodyParser = require("body-parser"),
  massive = require("massive"),
  socket = require("socket.io");

const { MASSIVE } = process.env;

const app = express();

app.use(bodyParser.json());

massive(MASSIVE).then(db => {
  app.set("db", db);
  console.log("massive happened");
});

// REGULAR ENDPOINTS HERE
app.get("/api/example", (req, res, next) => {
  res.status(200).send("hello");
});

const PORT = 4000;
const io = socket(
  app.listen(PORT, () =>
    console.log(`Housten we have lift off on port ${PORT}`)
  )
);

io.on("connection", socket => {
  console.log("User Connected");
  // io.emit('message dispatched', 'hello');
  // EVERYONE
  // socket.on('message sent', data => {
  //   console.log(data)
  //   io.emit('message dispatched', data.message);
  // })

  //  EVERYONE BUT ME
  // socket.on('message sent', data => {
  //   console.log(data)
  //   socket.broadcast.emit('message dispatched', data.message);
  // })

  // EVERYONE IN THE ROOM
  socket.on("join room", async data => {
    const { room } = data;
    const db = app.get("db");
    console.log("Room joined", room);
    let existingRoom = await db.check_room({ id: room });
    !existingRoom.length ? db.create_room({ id: room }) : null;
    let messages = await db.fetch_message_history({ id: room });
    socket.join(room);
    io.to(room).emit("room joined", messages);
  });
  socket.on("message sent", async data => {
    const { room, message } = data;
    const db = app.get("db");
    await db.create_message({ id: room, message });
    let messages = await db.fetch_message_history({ id: room });
    io.to(data.room).emit("message dispatched", messages);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected");
  });
});
