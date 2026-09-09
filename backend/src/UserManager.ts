import type { Socket } from "socket.io";
import { RoomManager } from "./RoomManager";

export interface User {
	socket: Socket;
	name: string;
}

export class UserManager {
	private users: User[] = [];
	private queue: string[] = [];
	private roomManager = new RoomManager();

	addUser(name: string, socket: Socket) {
		this.users.push({ name, socket });

		this.initHandlers(socket);

		this.queue.push(socket.id);
		socket.emit("lobby");

		this.clearQueue();
	}

	removeUser(socketId: string) {
		this.users = this.users.filter((u) => u.socket.id !== socketId);

	
		this.queue = this.queue.filter((id) => id !== socketId);
	}

	private clearQueue() {
		console.log("inside clear queue:", this.queue.length);

		if (this.queue.length < 2) return;

		
		const id1 = this.queue.shift();
		const id2 = this.queue.shift();
		if (!id1 || !id2) return;

		console.log("matching:", id1, id2);

		const user1 = this.users.find((u) => u.socket.id === id1);
		const user2 = this.users.find((u) => u.socket.id === id2);

		
		if (!user1 || !user2) return;

		console.log("creating room");
		this.roomManager.createRoom(user1, user2);

		
		this.clearQueue();
	}

	private initHandlers(socket: Socket) {
		socket.on("offer", ({ sdp, roomId }: { sdp: any; roomId: string }) => {
			this.roomManager.onOffer(roomId, sdp, socket.id);
		});

		socket.on("answer", ({ sdp, roomId }: { sdp: any; roomId: string }) => {
			this.roomManager.onAnswer(roomId, sdp, socket.id);
		});

		socket.on(
			"add-ice-candidate",
			({
				candidate,
				roomId,
				type,
			}: {
				candidate: any;
				roomId: string;
				type: "sender" | "receiver";
			}) => {
				this.roomManager.onIceCandidate(roomId, socket.id, candidate, type);
			}
		);
	}
}