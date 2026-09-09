import type { User } from "./UserManager";

let GLOBAL_ROOM_ID = 1;

interface Room {
	user1: User; 
	user2: User; 
}

export class RoomManager {
	private rooms: Map<string, Room>;

	constructor() {
		this.rooms = new Map();
	}

	createRoom(user1: User, user2: User) {
		const roomId = String(GLOBAL_ROOM_ID++);
		this.rooms.set(roomId, { user1, user2 });

		
		user1.socket.emit("send-offer", { roomId });

		
	}

	onOffer(roomId: string, sdp: any, senderSocketId: string) {
		const room = this.rooms.get(roomId);
		if (!room) return;

		const receivingUser =
			room.user1.socket.id === senderSocketId ? room.user2 : room.user1;

		receivingUser.socket.emit("offer", { sdp, roomId });
	}

	onAnswer(roomId: string, sdp: any, senderSocketId: string) {
		const room = this.rooms.get(roomId);
		if (!room) return;

		const receivingUser =
			room.user1.socket.id === senderSocketId ? room.user2 : room.user1;

		receivingUser.socket.emit("answer", { sdp, roomId });
	}

	onIceCandidate(
		roomId: string,
		senderSocketId: string,
		candidate: any,
		type: "sender" | "receiver"
	) {
		const room = this.rooms.get(roomId);
		if (!room) return;

		const receivingUser =
			room.user1.socket.id === senderSocketId ? room.user2 : room.user1;

		
		receivingUser.socket.emit("add-ice-candidate", { candidate, type });
	}
}