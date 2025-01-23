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

  lWWMap.current.set([0],[0,'']);
  lWWMap.current.set([end],[0,'']);
  
  const [lWWMapValue, setLWWMapVAlue]= useState(lWWMap.current.value)
  const [code, setCode] = useState(""); // 로컬 코드

  // 로컬 변경 사항 처리
  const handleCodeChange = (event) => {

    const updatedCode = event.target.value;
    var changeIndex = event.target.selectionStart -1; // 커서 위치
    var change = updatedCode[changeIndex];

    var left = lWWMapValue[changeIndex];
    var message;
   
    //존재 하면
    if(left){
        console.log(left[0]);
        lWWMap.current.set(left[0], change);
        message = {
          register: lWWMap.current.get(left[0])
        }

    }

    // applyLocalChange(change);
    setCode(updatedCode);
  };

  const sendDataToRoom = ({change}) =>{
      // 데이터 패킷 생성 및 전송
      const packet = JSON.stringify({ change });
      const encodedPacket = new TextEncoder().encode(packet);
      room.localParticipant.publishData(encodedPacket, DataPacket_Kind.RELIABLE);
  }


  // room 초기화 시 상태 플래그 활성화
  useEffect(() => {
    if (room) {
      setIsRoomReady(true);
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
