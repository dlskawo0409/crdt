import React, { useState, useEffect, useRef } from "react";
import { DataPacket_Kind, RoomEvent } from "livekit-client";
import "./CodeEditor.css";
import LSEQAllocator from "./LSEQAllocator"; // LSEQAllocator 클래스 파일 import
import LWWMap from "./LWWMap";


const CodeEditor = ({ room , participantName}) => {
  const [isRoomReady, setIsRoomReady] = useState(false);
  const start = 0;
  const end = 17;
  const lseq = useRef(new LSEQAllocator(end - 1)); // LSEQAllocator 인스턴스
  const lWWMap = useRef(new LWWMap(participantName));
  const [code, setCode] = useState(""); // 로컬 코드

  // 로컬 변경 사항 처리
  const handleCodeChange = (event) => {

    const updatedCode = event.target.value;
    const indexes = indexOfChange(code, updatedCode);

    const messages = []; // 반복문 외부에서 선언

    indexes.forEach((index) => {
      // console.log(index);
      let message = null; // 기본값 설정
      const values = lWWMap.current.value;
      const left = values[index][0];
      const right = values[index + 1][0];
      const change = updatedCode[index];
  
      console.log(index);
      if (right == `[${end}]`) {
        let newIndex = JSON.parse(right);
        while (lWWMap.current.has(newIndex)) {
          newIndex = lseq.current.alloc(JSON.parse(left), JSON.parse(right));
          console.log(newIndex);
        }
        lWWMap.current.set(newIndex, change);
        message = {
          key: newIndex,
          register: lWWMap.current.get(newIndex).state,
        };
      } else {
        lWWMap.current.set(right, change);
        message = {
          key: right,
          register: lWWMap.current.get(right).state,
        };
      }
    
      messages.push(message);
    });
    
    // 모든 메시지를 처리
    messages.forEach((message) => {
      // console.log(message);
      sendDataToRoom(message);
    });
    
    setCode(updatedCode);
    var left = [0];
    var right = [17];
    var newIndex = [17];
    // for(let i = 0; i<1000; i++){
    //   while (lWWMap.current.has(newIndex)) {
    //     newIndex = lseq.current.alloc(JSON.parse(left), JSON.parse(right));
    //     console.log(newIndex);
    //     left = newIndex;
    //   }
    // }
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
      lWWMap.current.set([0],'');
      lWWMap.current.set([end],'');
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
