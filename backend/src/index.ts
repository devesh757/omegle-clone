import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import { UserManager } from "./UserManager";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
	cors: { origin: "*" },
});

const userManager = new UserManager();

io.on("connection", (socket: Socket) => {
	console.log("a user connected:", socket.id);

	userManager.addUser("randomName", socket);

	socket.on("disconnect", (reason) => {
		console.log("user disconnected:", socket.id, "reason:", reason);
		userManager.removeUser(socket.id);
	});
});

server.listen(3000, () => {
	console.log("listening on *:3000");
});