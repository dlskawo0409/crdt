import React, { useState, useEffect, useRef } from "react";
import { DataPacket_Kind, RoomEvent } from "livekit-client";
import "./CodeEditor.css";
import LSEQAllocator from "./LSEQAllocator"; // LSEQAllocator 클래스 파일 import
import LWWMap from "./LWWMap";
import LWWRegister from './LWWRegister.js';

const CodeEditor = ({ room }) => {
  const [isRoomReady, setIsRoomReady] = useState(false);
  const start = 0;
  const end = 17;
  const lseq = useRef(new LSEQAllocator(end - 1)); // LSEQAllocator 인스턴스
  const lWWMap = useRef(new LWWMap);
  // const [lWWMapValue, setLWWMapVAlue]= useState(lWWMap.current.value)
  const [code, setCode] = useState(""); // 로컬 코드

  // 로컬 변경 사항 처리
  const handleCodeChange = (event) => {

    const updatedCode = event.target.value;
    var changeIndex = event.target.selectionStart -1; // 커서 위치
    var change = updatedCode[changeIndex];
    var left = lWWMap.current.value;
    console.log(left);
    var message;
    //존재 하면
    if(left){

        lWWMap.current.set(left[0][0] , change);
        console.log(lWWMap.current.get(left[0][0]));
        message = {
          key : left[0][0],
          register: lWWMap.current.get(left[0][0])
        }
        sendDataToRoom(message);
        // setLWWMapVAlue(lWWMap.current.value);
    }

    // applyLocalChange(change);
    setCode(updatedCode);
  };



  const sendDataToRoom = ({message}) =>{
      // 데이터 패킷 생성 및 전송
      const packet = JSON.stringify({ message });
      const encodedPacket = new TextEncoder().encode(packet);
      room.localParticipant.publishData(encodedPacket, DataPacket_Kind.RELIABLE);
  }

    // 다른 사용자의 데이터 수신 처리
  useEffect(() => {
    const handleDataReceived = (payload, participant) => {
      const decodedMessage = new TextDecoder().decode(payload);
      const msg = JSON.parse(decodedMessage);

      // 수신된 변경 사항을 반영
      lWWMap.current.merge(msg.key, msg.register);

      console.log(`Received change from ${participant.identity}:`, msg.key, msg.register);
    };

    if (room) {
      room.on(RoomEvent.DataReceived, handleDataReceived);
    }

    return () => {
      if (room) {
        room.off(RoomEvent.DataReceived, handleDataReceived);
      }
    };
  }, [room]);


  // room 초기화 시 상태 플래그 활성화
  useEffect(() => {
    if (room) {
      setIsRoomReady(true);
      lWWMap.current.set([0],[0,'']);
      lWWMap.current.set([end],[0,'']);
    }
  }, [room]);

  return (
    <div className="code-editor">
      <textarea
        className="code-editor-textarea"
        value={code}
        onChange={handleCodeChange}
        placeholder="Write your code here..."
      ></textarea>
      <div className="code-editor-preview">
        <h3>Your Code:</h3>
        <pre>{code}</pre>
      </div>
    </div>
  );
};

export default CodeEditor;
