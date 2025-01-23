import LWWRegister from './LWWRegister.js';
import TreeMap from './TreeMap.js';
class LWWMap {
    constructor( participantName) {
      this._data = new TreeMap();
      this.participantName = participantName;
      // 초기 상태의 각 키에 대해 새 레지스터를 생성합니다.
      // if(state != null)
      // for (const [key, register] of Object.entries(state)) {
      //   this._data.set(key, new LWWRegister(register));
      // }
    }
    _toKey(key) {
        return Array.isArray(key) ? JSON.stringify(key) : key;
      }

      get text(){
        let value = "";
        for (const [key, register] of this._data.entries()) {
          if (register.value !== null) value +=  register.value[1];
        }
        return value;
      }

      get value(){
        const value = {};
    
        for (const [key, register] of this._data.entries()) {
        
          if (register.value!== null) value[key] = register.value;
        }
        return value;
      }


    // get value() {
    //     const value = {};
    //     // 각 값이 해당 키의 레지스터 값으로 설정된 객체를 구축합니다.
    //     for (const [key, register] of this._data.entries()) {
    //       if (register.value !== null) value[key] = register.value;
    //     }
      
    //     // 객체를 배열로 변환한 후 정렬
    //     const sortedEntries = Object.entries(value).sort((a, b) => {
    //       const keyA = a[0].split(',').map(Number); // 쉼표로 나누고 숫자 배열로 변환
    //       const keyB = b[0].split(',').map(Number);
      
    //       // 2. 배열 길이가 같을 경우 각 요소를 순서대로 비교
    //       for (let i = 0; i < keyA.length; i++) {
    //         if (keyA[i] !== keyB[i]) {
    //           return keyA[i] - keyB[i];
    //         }
    //       }

    //       if (keyA.length !== keyB.length) {
    //         return keyA.length - keyB.length;
    //       }
      
      
    //       return 0; // 완전히 동일한 경우
    //     });
      
    //     return sortedEntries; // 정렬된 배열 반환
    //   }

    // get text() {
    //   const value = "";
    //   // 각 값이 해당 키의 레지스터 값으로 설정된 객체를 구축합니다.
    //   for ( register of this.value()) {
    //      value += register.value;
    //   }
    //   return value;
    // }
      
    get state() {
      const state = {};
      // 각 값이 해당 키에서 레지스터의 전체 상태로 설정된 객체를 구축합니다.
      for (const [key, register] of this._data.entries()) {
        if (register) state[key] = register.state;
      }
      return state;
    }
  
    has(key) {
      return this._data.get(key)?.value !== null;
    }
  
    get(key) {
    //   return this._data.get(key)?.value;
        // const keyString = Array.isArray(key) ? JSON.stringify(key) : key;
        return this._data.get(key); 
    }
  
    // set(key, value) {
    //   // 주어진 키에서 레지스터를 가져옵니다
    //   // 레지스터가 이미 존재하면 값을 설정합니다.
    //   const register = this._data.get(key);
    //   if (register) {
    //     register.set(value);
    //   } else {
    //     // 그렇지 않으면 값으로 새 `LWWRegister`를 인스턴스화합니다.
    //     this._data.set(key, new LWWRegister([0, value]));
        
    //   }
    // }

    set(key, value) {

        const realKey = this._toKey(key);
        const register = this._data.get(realKey);
        if (register) {
          register.set(value);
        } else {
          this._data.set(realKey, new LWWRegister([this.participantName,0, value]));
        }
      }
  
    delete(key) {
      // register가 존재하는 경우 null로 처리
      this._data.get(key)?.set(null);
    }
  
    merge(key,remote) {
      // 각 키의 레지스터를 해당 키의 수신 상태와 재귀적으로 병합합니다.
      const local = this._data.get(key);
      // 레지스터가 이미 존재하면 들어오는 상태와 병합합니다.
      if (local) {
        local.merge(remote);
      } else {
        // 그렇지 않으면, 들어오는 상태와 함께 새로운 `LWWRegister`를 인스턴스화합니다.
        this._data.set(key, new LWWRegister([this.participantName ,0, remote]));
      }
    }
  }
  

  export default LWWMap;