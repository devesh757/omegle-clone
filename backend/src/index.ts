import { Socket } from "socket.io"
import { Server }  from "socket.io"
import http from "http"

import express from "express"
import { UserManager } from "./UserManager"

const app = express();
const server = http.createServer(http);

const io = new Server(server,{
    cors:{
        origin: "*"
    }
});

const userManger = new UserManager();

io.on('connection',(socket: Socket) => {
    console.log('a user connected');
    userManger.addUser("randomName",socket);
    socket.on('disconnect',() => {
        console.log("user discoonected");
        userManger.removeUser(socket.id)
    })
});

server.listen(3000,() => {
    console.log('listening on *:3000')
})
