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
  const editorRef  = useRef(null);
  const ignoreChangeRef = useRef(false);
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const handleCodeChange = (value, event) => {

    const updatedCode = value
    const [indexes,query ]= indexOfChange(code, value)
    let messages = [];
    console.log(indexes);
    indexes.forEach((index) => {
      // if (ignoreChangeRef.current) {
      //   return;
      // }

      const values = lWWMap.current.value;
      console.log(values);
      const left = values[index][0];
      const right = values[index + 1][0];
      var change = updatedCode[index];
      let changeIndex;

      change = change === undefined ? '' : change;
      if (change === '\n') { 
        changeIndex = lseq.current.alloc(JSON.parse(left), JSON.parse(right)); 
        lWWMap.current.set(changeIndex, '\r');
        messages.push({
          key: changeIndex,
          register: lWWMap.current.get(changeIndex).state,
        })
        changeIndex = lseq.current.alloc(JSON.parse(changeIndex), JSON.parse(right));
      }
      else if (query === 'insert') {
        changeIndex = lseq.current.alloc(JSON.parse(left), JSON.parse(right));    
      }
      else {
        changeIndex = right;
      }  

        console.log(left, right, changeIndex, change);
   
      

      lWWMap.current.set(changeIndex, change);
      messages.push({
        key: changeIndex,
        register: lWWMap.current.get(changeIndex).state,
      });
      
      let jsonString = JSON.stringify(messages);
      let byteSize = new TextEncoder().encode(jsonString).length;

      if (byteSize >= 50000) {
        sendDataToRoom({ messages: messages, left: 1 });
        messages = [];
      }

    });

    sendDataToRoom({ messages:messages, left:0 });  

    setCode(lWWMap.current.text);

  };

  const indexOfChange = (before, after) => {
    const indexes = [];
    // let one = false;

    // if (Math.abs(before.length - after.length) === 1) {
    //   one = true;
    // }
    const maxLength = Math.max(before.length, after.length);

    for (let i = 0; i < maxLength; i++) {
      if (before[i] !== after[i]) {
        if (after[i] === '\n') {
          continue;
        }
        indexes.push(i);
        // if (one) {
        //   break;
        // }
      }
    }
    return [indexes, before.length > after.length ? 'delete' : 'insert' ];
  };

  const sendDataToRoom = (message) => {
    const packet = JSON.stringify(message);
    const encodedPacket = new TextEncoder().encode(packet);
    room.localParticipant.publishData(encodedPacket, DataPacket_Kind.RELIABLE);
  };

  const sendAll = () => {
    sendWithBuffer(lWWMap.current.allMessage);
    // sendDataToRoom(lWWMap.current.allMessage);
  };

  const sendWithBuffer = (messages) => {
    let jsonBuffer = [];
    let byteSize = 0;
    const max = 50000; // 최대 바이트 크기
    const textEncoder = new TextEncoder();
  
    messages.forEach((message) => {
      const temp = JSON.stringify(message);
      const tempSize = textEncoder.encode(temp).length;
  
      if (byteSize + tempSize > max) {
        // 버퍼가 초과되면 전송
        const jsonString = {
          messages: jsonBuffer,
          left: 1,
        };
        sendDataToRoom(jsonString);
  
        // 초기화
        jsonBuffer = [];
        byteSize = 0;
      }
  
      // 메시지를 버퍼에 추가
      jsonBuffer.push(message);
      byteSize += tempSize;
    });
  
    // 남은 메시지 전송
    if (jsonBuffer.length > 0) {
      const jsonString = {
        messages: jsonBuffer,
        left: 0,
      };
      sendDataToRoom(jsonString);
    }
  };
  

  useImperativeHandle(ref, () => ({
    triggerSendAll: sendAll,
  }));

  useEffect(() => {
    const handleDataReceived = (payload) => {
      const decodedMessage = new TextDecoder().decode(payload);
      const msgs = JSON.parse(decodedMessage);
      const messages = msgs.messages;
      const isLeft = msgs.left;

      if (messages !== '') {
        messages.forEach((msg) => {
          lWWMap.current.merge(msg.key, msg.register);
        })         
     }
      

      if (isLeft === 0 && editorRef.current) {
        const newText = lWWMap.current.text;
        const editor = editorRef.current;
        const oldText = editor.getValue(); 
        const model = editor.getModel();
    

        if (model) {
          const oldText = model.getValue();
          // const indexes = indexOfChange(oldText, newText);
          // indexes.forEach((index) => {
            
          // })
  
          // if (oldText !== newText) {

          //   editor.executeEdits("", [
          //     {
          //       range: model.getFullModelRange(),
          //       text: newText,
          //     },
          //   ]);
          // }

          // if (oldText !== newText) {
          //   ignoreChangeRef.current = true; // 변경 이벤트 무시 플래그 설정
    
          //   editor.executeEdits("", [
          //     {
          //       range: model.getFullModelRange(),
          //       text: newText,
          //     },
          //   ]);
    
          //   setTimeout(() => {
          //     ignoreChangeRef.current = false; // 일정 시간 후 플래그 해제
          //   }, 0);
          // }
          setCode(lWWMap.current.text);
        }
      }
      
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
    
      // for (let i = 1; i < 375; ++i) {
      //   lWWMap.current.set([i], "");
      // }
    }
  }, [room]);

  return (
    <Editor
      height="90vh"
      defaultLanguage="javascript"
      value={code}
      onChange={handleCodeChange}
      onMount={handleEditorDidMount}
      
    />
  );
});

export default CodeEditor;
