import { useState, useEffect, useRef } from "react";
import { Room } from "./Room";

export const Landing = () => {
	const [name, setName] = useState("");
	const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
	const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);

	const videoRef = useRef<HTMLVideoElement>(null);
	const [joined, setJoined] = useState(false);

	useEffect(() => {
		const getCam = async () => {
			const stream = await window.navigator.mediaDevices.getUserMedia({
				video: true,
				audio: true,
			});

			const audioTrack = stream.getAudioTracks()[0] || null;
			const videoTrack = stream.getVideoTracks()[0] || null;

			setLocalAudioTrack(audioTrack);
			setLocalVideoTrack(videoTrack);

			if (videoRef.current && videoTrack) {
				videoRef.current.srcObject = new MediaStream([videoTrack]);
				videoRef.current.muted = true;
				videoRef.current.playsInline = true;
				videoRef.current.play().catch(() => {});
			}
		};

		getCam();
	}, []);

	if (!joined) {
		return (
			<div>
				<video ref={videoRef} autoPlay playsInline muted />
				<input
					type="text"
					onChange={(e) => setName(e.target.value)}
					placeholder="Your name"
				/>
				<button onClick={() => setJoined(true)}>Join</button>
			</div>
		);
	}

	return (
		<Room
			name={name}
			localAudioTrack={localAudioTrack}
			localVideoTrack={localVideoTrack}
		/>
	);
};