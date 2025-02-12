import {
    // LocalVideoTrack,
    // RemoteParticipant,
    //   RemoteTrack,
    // RemoteTrackPublication,
    // Participant,
    // RemoteParticipant,
    Room,
    RoomEvent
} from "livekit-client";
import "./App.css";
import { useEffect, useRef, useState } from "react";
import VideoComponent from "./components/VideoComponent";
import AudioComponent from "./components/AudioComponent";
import CodeEditor from "./components/CodeEditor.js";

// When running OpenVidu locally, leave these variables empty
// For other deployment type, configure them with correct URLs depending on your deployment
// let APPLICATION_SERVER_URL = "https://70.12.247.116:8443/";
// let APPLICATION_SERVER_URL = "";
// let APPLICATION_SERVER_URL = "https://i12a702.p.ssafy.io:8080/api/v1/";
// let LIVEKIT_URL = "wss://i12a702.p.ssafy.io:7443/";
// let LIVEKIT_URL="wss://70-12-247-116.openvidu-local.dev:7443";

let APPLICATION_SERVER_URL = "https://i12a702.p.ssafy.io:8080/api/v1/";
let LIVEKIT_URL = "wss://i12a702.p.ssafy.io:8443";

configureUrls();

function configureUrls() {
    if (!APPLICATION_SERVER_URL) {
        if (window.location.hostname === "localhost") {
            APPLICATION_SERVER_URL = "http://localhost:6080/";
        } else {
            APPLICATION_SERVER_URL = "https://" + window.location.hostname + ":8443/";
        }
    }

    if (!LIVEKIT_URL) {
        if (window.location.hostname === "localhost") {
            LIVEKIT_URL = "ws://localhost:7880/";
        } else {
            LIVEKIT_URL = "wss://70-12-247-116.openvidu-local.dev:7443";
        }
    }
}




function App() {
    const [room, setRoom] = useState(undefined);
    const [localTrack, setLocalTrack] = useState(undefined);
    const [remoteTracks, setRemoteTracks] = useState([]);
    const [participantName, setParticipantName] = useState("Participant" + Math.floor(Math.random() * 100));
    const [roomName, setRoomName] = useState("Test Room");
    const  CodeEditorRef = useRef();
    async function joinRoom() {
        const room = new Room();
        setRoom(room);

        room.on(
            RoomEvent.TrackSubscribed,
            (track, publication, participant) => {

                // console.log(room.localParticipant.joinedAt);
                let earliestParticipant = null;
                for (const [key, remoteParticipant] of room.remoteParticipants.entries()) {
                    if (!earliestParticipant || remoteParticipant.joinedAt < earliestParticipant.joinedAt) {
                        earliestParticipant = remoteParticipant;
                    }
                }
                
                // if (earliestParticipant.joinedAt > room.localParticipant.joinedAt) {
                //     CodeEditorRef.current.triggerSendAll();
                // }

                setRemoteTracks((prev) => {
                    return [
                        ...prev,
                        { trackPublication: publication, participantIdentity: participant.identity }
                    ];
                });
            }
        );

        room.on(RoomEvent.TrackUnsubscribed, (track, publication) => {
            setRemoteTracks((prev) => prev.filter((track) => track.trackPublication.trackSid !== publication.trackSid));
        });

        //   room.on(RoomEvent.DataReceived, (payload, participant) => {
        //     const decodedMessage = new TextDecoder().decode(payload);
        //     console.log(`Received message from ${participant.identity}: ${decodedMessage}`);
        //   });

        try {

            // const token = await getToken(roomName, participantName);
            const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkbHNrYXdvMDQwOUBuYXZlci5jb20iLCJpc3MiOiJBUElnY1NLMldic3B6aHMiLCJ2aWRlbyI6eyJyb29tSm9pbiI6dHJ1ZSwicm9vbSI6IjUifSwic2lwIjp7fSwiZXhwIjoxNzM5MzY1ODA1LCJqdGkiOiJkbHNrYXdvMDQwOUBuYXZlci5jb20ifQ.EgVjhKPtM8jRJJywf1-VONnmOsKpwi9YI20XV9QHWUk";

            await room.connect(LIVEKIT_URL, token);

            await room.localParticipant.enableCameraAndMicrophone();

            setLocalTrack(room.localParticipant.videoTrackPublications.values().next().value.videoTrack);

        } catch (error) {
            console.log("There was an error connecting to the room:", error.message);
            await leaveRoom();
        }
    }

    async function leaveRoom() {
        await room?.disconnect();

        setRoom(undefined);
        setLocalTrack(undefined);
        setRemoteTracks([]);
    }



    async function getToken(roomName) {
        const response = await fetch(APPLICATION_SERVER_URL + "token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                roomName: roomName,
                participantName: participantName
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to get token: ${error.errorMessage}`);
        }

        const data = await response.json();
        return data.token;
    }

    return (
        <>
            {!room ? (
                <div id="join">
                    <div id="join-dialog">
                        <h2>Join a Video Room</h2>
                        <form
                            onSubmit={(e) => {
                                joinRoom();
                                e.preventDefault();
                            }}
                        >
                            <div>
                              <label htmlFor="participant-name">Participant</label>
                              <input
                                  id="participant-name"
                                  className="form-control"
                                  type="text"
                                  value={participantName}
                                  onChange={(e) => setParticipantName(e.target.value)}
                                  required
                              />
                          </div> 
                            <div>
                                <label htmlFor="room-name">Room</label>
                                <input
                                    id="room-name"
                                    className="form-control"
                                    type="text"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                className="btn btn-lg btn-success"
                                type="submit"
                                //   disabled={!roomName || !participantName}
                                disabled={!roomName}
                            >
                                Join!
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div id="room">
                    <div id="room-header">
                        <h2 id="room-title">{roomName}</h2>
                        <button className="btn btn-danger" id="leave-room-button" onClick={leaveRoom}>
                            Leave Room
                        </button>
                    </div>
                    <div id="layout-container">
                        {localTrack && (
                            <VideoComponent track={localTrack} participantIdentity={participantName} local={true} />

                        )}
                        {remoteTracks.map((remoteTrack) =>
                            remoteTrack.trackPublication.kind === "video" ? (
                                <VideoComponent
                                    key={remoteTrack.trackPublication.trackSid}
                                    track={remoteTrack.trackPublication.videoTrack}
                                    participantIdentity={remoteTrack.participantIdentity}
                                />
                            ) : (
                                <AudioComponent
                                    key={remoteTrack.trackPublication.trackSid}
                                    track={remoteTrack.trackPublication.audioTrack}
                                />
                            )
                        )}
                    </div>
                        <CodeEditor ref={CodeEditorRef} room={room} participantName={participantName} />
  
                </div>
            )}
        </>
    );
}

export default App;
