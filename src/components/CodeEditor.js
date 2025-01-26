import React, { useState, useEffect, useRef } from "react";
import { DataPacket_Kind, RoomEvent } from "livekit-client";
import "./CodeEditor.css";
import LSEQAllocator from "./LSEQAllocator"; // LSEQAllocator 클래스 파일 import
import LWWMap from "./LWWMap";


const CodeEditor = ({ room , participantName}) => {
  const [isRoomReady, setIsRoomReady] = useState(false);
  const start = 0;
  const end = 999999999999;
  const lseq = useRef(new LSEQAllocator()); // LSEQAllocator 인스턴스
  const lWWMap = useRef(new LWWMap(participantName));
  const [code, setCode] = useState(""); // 로컬 코드

  // 로컬 변경 사항 처리
  const handleCodeChange = (event) => {

    const updatedCode = event.target.value;
    const indexes = indexOfChange(code, updatedCode);

    const messages = []; // 반복문 외부에서 선언

    indexes.forEach((index) => {

        let message = null; 
        const values = lWWMap.current.value;
        const left = values[index][0];
        const right = values[index + 1][0];
        const change = updatedCode[index];
      
        var changeIndex;
    
        if (right == `[${end}]` || indexes.length !== 1) {
          changeIndex = lseq.current.alloc(JSON.parse(left), JSON.parse(end));
          // console.log("changeIndex",changeIndex);
        } else {
          changeIndex = right;
        }

        // console.log("before set",lWWMap.current.get(changeIndex).state);
        lWWMap.current.set(changeIndex, change);
        // console.log(changeIndex,lWWMap.current.get(changeIndex).state);
        message = {
          key: changeIndex,
          register: lWWMap.current.get(changeIndex).state,
        };


      
        messages.push(message);
      });

    
    // 모든 메시지를 처리
    messages.forEach((message) => {
      // console.log(message);
      sendDataToRoom(message);
    });
    
    setCode(updatedCode);
   
  };

  const indexOfChange = (before, after) => {
    const indexes = [];
    const maxLength = Math.max(before.length, after.length);
  
    for (let i = 0; i < maxLength; i++) {
      // 두 문자열의 같은 인덱스 값이 다르거나, 한 문자열이 짧아 비교할 수 없는 경우
      if (before[i] !== after[i]) {
        indexes.push(i); // 다른 인덱스를 추가
      }
    }
  
    return indexes;
  };


  const sendDataToRoom = (message) => {
    const packet = JSON.stringify(message); // 중첩 없이 직렬화
    const encodedPacket = new TextEncoder().encode(packet);
    room.localParticipant.publishData(encodedPacket, DataPacket_Kind.RELIABLE);
  };
  

    // 다른 사용자의 데이터 수신 처리
  useEffect(() => {
    const handleDataReceived = (payload, participant) => {
      const decodedMessage = new TextDecoder().decode(payload);
      const msg = JSON.parse(decodedMessage);
      // console.log(`Received change from ${participant.identity}:`, msg.key, msg.register);
      // 수신된 변경 사항을 반영
      lWWMap.current.merge(msg.key, msg.register);
      // console.log(lWWMap.current.text);
      setCode(lWWMap.current.text);
      
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
      // 초기 복붙이 늦어서
      for(let i = 1; i<1500;++i){
        lWWMap.current.set([i], '');
      }
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
