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
  const beforeValues = useRef("");

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    const model = editor.getModel();
    model.setEOL(monaco.editor.EndOfLineSequence.LF);
  };

  const handleCodeChange = (value, event) => {
    const [indexes, query] = indexOfChange(lWWMap.current.text, value);
    let messages = [];
    indexes.forEach((index) => {

      const values = lWWMap.current.value;
      const left = values[index][0];
      let right = values[index + 1][0];
      var change = value[index];
      let changeIndex;

      change = change === undefined ? '' : change;
  
      if (query === 'insert') {
        changeIndex = lseq.current.alloc(JSON.parse(left), JSON.parse(right));    
      }
      else {
        changeIndex = right;
      }  
  
      // console.log("changeIndex", changeIndex, left, right);
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
    const diff = [];
    const maxLength = Math.max(before.length, after.length);
    let one = Math.abs(after.length - before.length) === 1;

    for (let i = 0; i < maxLength; i++) {
      if (before[i] !== after[i]) {
        indexes.push(i);
        diff.push(after[i]);
        if (one) {
          break;
        }
      }
    }

    return [indexes, before.length > after.length ? 'delete' : 'insert' ];
  };

  function findDifferences(before, after) {
    const differences = [];

    const maxLength = Math.max(before.length, after.length);
    let one = Math.abs(after.length - before.length) === 1;
    for (let i = 0; i < maxLength; i++) {
        const item1 = before[i] || [];
        const item2 = after[i] || [];

        console.log(JSON.stringify(item1),JSON.stringify(item2), JSON.stringify(item1) !== JSON.stringify(item2))
      
        if (JSON.stringify(item1) !== JSON.stringify(item2)) {
          differences.push(i);
          if (one) {
            break;
          }
            
        }
    }

    return [differences, before.length > after.length ? 'delete' : 'insert'  ];
}



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
