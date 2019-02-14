require("dotenv").config();
const express = require("express"),
  bodyParser = require("body-parser"),
  massive = require("massive"),
  socket = require("socket.io");

const { SERVER_PORT, MASSIVE } = process.env;

const app = express(),
  io = socket(
    app.listen(SERVER_PORT, () =>
      console.log(`Houston we have lift off on port ${SERVER_PORT}`)
    )
  );

app.use(bodyParser.json());

massive(MASSIVE).then(db => {
  app.set("db", db);
  console.log("massive happened");
});

// REGULAR ENDPOINTS HERE
app.get("/api/example", (req, res, next) => {
  res.status(200).send("hello");
});

io.on("connection", socket => {
  console.log("User Connected");

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
