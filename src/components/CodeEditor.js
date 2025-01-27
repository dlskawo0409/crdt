import React, { useState, useEffect, useRef , forwardRef ,useImperativeHandle } from "react";
import { DataPacket_Kind, RoomEvent } from "livekit-client";
import "./CodeEditor.css";
import LSEQAllocator from "./LSEQAllocator"; // LSEQAllocator 클래스 파일 import
import LWWMap from "./LWWMap";
import { Editor } from "@monaco-editor/react";

const CodeEditor = forwardRef(({ room, participantName }, ref) => {
  const [isRoomReady, setIsRoomReady] = useState(false);
  const start = 0;
  const end = 999999999999;
  const lseq = useRef(new LSEQAllocator());
  const lWWMap = useRef(new LWWMap(participantName));
  const [code, setCode] = useState("");
  const textAreaRef = useRef(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const handleEditorDidMount = (editor, monaco) => {
    textAreaRef.current = editor; // editor 인스턴스를 저장
    setCursorPosition(textAreaRef.selectionStart);
  };

  const handleCodeChange = (value, event) => {
    const updatedCode = value
    const indexes = 
    const messages = [];
    // console.log("test" ,lseq.current.alloc(JSON.parse(`[1]`), JSON.parse(`[2]`)));
    indexes.forEach((index) => {
      // console.log(index);
      const values = lWWMap.current.value;
     
      const left = values[index][0];
      const right = values[index + 1][0];
      var change = updatedCode[index];
      let changeIndex;
      change =  change === undefined ? '' : change;

      // if (change === '\n'|| change === '\r') {
      //   console.log("enter");
      //   changeIndex = right;
      // }
      // else {
      //   changeIndex = lseq.current.alloc(JSON.parse(left), JSON.parse(right));
      //   console.log(left, right, changeIndex);
      // }

  

      // changeIndex = lseq.current.alloc(JSON.parse(left), JSON.parse(right));
      if (right === `[${end}]`) {
        changeIndex = lseq.current.alloc(JSON.parse(left), JSON.parse(end));
      } else {
        changeIndex = right;
      }


      lWWMap.current.set(changeIndex, change);
      // console.log(lWWMap.current.value);
      // console.log(changeIndex);
      messages.push({
        key: changeIndex,
        register: lWWMap.current.get(changeIndex).state,
      });

    });

    messages.forEach((message) => {
      sendDataToRoom(message);
    });

    setCode(lWWMap.current.text);
  };

  const indexOfChange = (before, after) => {
    const indexes = [];
    const maxLength = Math.max(before.length, after.length);
    for (let i = 0; i < maxLength; i++) {
      if (before[i] !== after[i]) {
        indexes.push(i);
      }
    }
    return indexes;
  };

  const sendDataToRoom = (message) => {
    const packet = JSON.stringify(message);
    const encodedPacket = new TextEncoder().encode(packet);
    room.localParticipant.publishData(encodedPacket, DataPacket_Kind.RELIABLE);
  };

  const sendAll = () => {
    for (const [key, value] of lWWMap.current.state) {
      sendDataToRoom({
        key: key,
        register: value.state,
      });
    }
  };

  useImperativeHandle(ref, () => ({
    triggerSendAll: sendAll,
  }));

  useEffect(() => {
    const handleDataReceived = (payload, participant) => {
      const decodedMessage = new TextDecoder().decode(payload);
      const msg = JSON.parse(decodedMessage);
      // console.log(msg);
      if (msg !== null) {
        // const textArea = textAreaRef.current;
        // const cursorStart = textArea.selectionStart;
        // const cursorEnd = textArea.selectionEnd;

        lWWMap.current.merge(msg.key, msg.register);
        

        // setTimeout(() => {
        //   textArea.setSelectionRange(cursorStart, cursorEnd);
        // }, 0);
      }
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


  useEffect(() => {
    if (room) {
      setIsRoomReady(true);
    
      for (let i = 1; i < 375; ++i) {
       
        lWWMap.current.set([i], "");
        // lWWMap.current.set([i, 0], "");
      }
    }
  }, [room]);

  return (
    <Editor
      height="90vh"
      defaultLanguage="javascript"
      value={code}
      onChange={handleCodeChange}
      onMount={handleEditorDidMount} // 에디터 인스턴스 가져오기
    />
  );
});

export default CodeEditor;
