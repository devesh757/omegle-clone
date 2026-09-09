import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";

const URL = "http://localhost:3000";

declare global {
	interface Window {
		pcr: RTCPeerConnection;
	}
}

const pcConfig: RTCConfiguration = {
	iceServers: [{ urls: "stun:stun.l.google.com:19302" }], 
};

async function safePlay(video: HTMLVideoElement) {
	try {
		await video.play();
	} catch (err: any) {
		
		if (err?.name !== "AbortError") console.error("video.play() failed:", err);
	}
}

export const Room = ({
	name,
	localAudioTrack,
	localVideoTrack,
}: {
	name: string;
	localAudioTrack: MediaStreamTrack | null;
	localVideoTrack: MediaStreamTrack | null;
}) => {
	const [lobby, setLobby] = useState(true);

	const socketRef = useRef<Socket | null>(null);

	
	const pcRef = useRef<RTCPeerConnection | null>(null);

	
	const localAudioRef = useRef<MediaStreamTrack | null>(null);
	const localVideoRef = useRef<MediaStreamTrack | null>(null);

	const localVideoEl = useRef<HTMLVideoElement>(null);
	const remoteVideoEl = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		localAudioRef.current = localAudioTrack;
		localVideoRef.current = localVideoTrack;
	}, [localAudioTrack, localVideoTrack]);

	
	useEffect(() => {
		if (!localVideoEl.current || !localVideoTrack) return;
		const stream = new MediaStream([localVideoTrack]);
		localVideoEl.current.srcObject = stream;
		safePlay(localVideoEl.current);
	}, [localVideoTrack]);

	function attachRemote(stream: MediaStream) {
		const el = remoteVideoEl.current;
		if (!el) return;

		
		if (el.srcObject !== stream) {
			el.pause();
			el.srcObject = stream;
			safePlay(el);
		}
	}

	function buildPeerConnection(roomId: string, type: "sender" | "receiver") {
		const socket = socketRef.current!;
		const pc = new RTCPeerConnection(pcConfig);
		pcRef.current = pc;

		pc.onicecandidate = (e) => {
			if (e.candidate) {
				socket.emit("add-ice-candidate", {
					candidate: e.candidate,
					type,
					roomId,
				});
			}
		};

	
		pc.ontrack = (e) => {
			const stream = e.streams?.[0];
			if (stream) attachRemote(stream);
		};

		return pc;
	}

	function addLocalTracks(pc: RTCPeerConnection) {
		const a = localAudioRef.current;
		const v = localVideoRef.current;

		const tracks = [v, a].filter(Boolean) as MediaStreamTrack[];
		if (tracks.length === 0) return;

		const stream = new MediaStream(tracks);
		for (const t of tracks) {
		
			const already = pc.getSenders().some((s) => s.track?.id === t.id);
			if (!already) pc.addTrack(t, stream);
		}
	}

	useEffect(() => {
		const socket = io(URL);
		socketRef.current = socket;

		socket.on("lobby", () => setLobby(true));

		
		socket.on("send-offer", async ({ roomId }) => {
			setLobby(false);

			pcRef.current?.close();
			pcRef.current = null;

			const pc = buildPeerConnection(roomId, "sender");

		
			addLocalTracks(pc);

	
			const offer = await pc.createOffer();
			await pc.setLocalDescription(offer);

			socket.emit("offer", { roomId, sdp: offer });
		});

		
		socket.on("offer", async ({ roomId, sdp: remoteSdp }) => {
			setLobby(false);

			pcRef.current?.close();
			pcRef.current = null;

			const pc = buildPeerConnection(roomId, "receiver");

		
			addLocalTracks(pc);

			await pc.setRemoteDescription(remoteSdp);

			const answer = await pc.createAnswer();
			await pc.setLocalDescription(answer);

			socket.emit("answer", { roomId, sdp: answer });
		});

		
		socket.on("answer", async ({ sdp: remoteSdp }) => {
			setLobby(false);
			await pcRef.current?.setRemoteDescription(remoteSdp);
		});

		
		socket.on("add-ice-candidate", async ({ candidate }) => {
			try {
				await pcRef.current?.addIceCandidate(candidate);
			} catch (e) {
				console.error("addIceCandidate error:", e);
			}
		});

		return () => {
			socket.disconnect();
			socketRef.current = null;
			pcRef.current?.close();
			pcRef.current = null;
		};
	}, [name]);

	return (
		<div>
			<h3>Hi {name}</h3>

			<video ref={localVideoEl} playsInline  width={800} height={500} />
			{lobby ? <p>Waiting to connect you to someone...</p> : null}
			<video ref={remoteVideoEl} playsInline width={800} height={500} />
		</div>
	);
};