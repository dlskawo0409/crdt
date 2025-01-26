import LWWRegister from './LWWRegister.js';
import TreeMap from './TreeMap.js';
class LWWMap {
    constructor( participantName) {
      this._data = new TreeMap();
      this.participantName = participantName;
      this.set([0], '');
      this.set( [999999999999], '')
    }
    _toKey(key) {
        return Array.isArray(key) ? JSON.stringify(key) : key;
      }

      get text(){
        let value = "";
        for (const [key, register] of this._data.entries()) {

          if (register.value !== null) value +=  register.value;
        }
        return value;
      }

      get value(){
        
        const value = [];
    
        for (const [key, register] of this._data.entries()) {
        
          if (register.value!== null)   value.push([key, register.value]);
        }
        return value;
      }

    get state() {
      const state = {};
      // 각 값이 해당 키에서 레지스터의 전체 상태로 설정된 객체를 구축합니다.
      for (const [key, register] of this._data.entries()) {
        if (register) state[key] = register.state;
      }
      return state;
    }
  
    has(key) {
      const realKey = this._toKey(key);
      return this._data.get(realKey)?.value !== undefined;
    }
  
    get(key) {
        const realKey = this._toKey(key);
        return this._data.get(realKey); 
    }
  

    set(key, value) {
        const realKey = this._toKey(key);
        const register = this._data.get(realKey);

        if (register) {
          register.set(value);
        } else {
          this._data.set(realKey,new LWWRegister([this.participantName ,0, value] ));
        }
      }
  
    delete(key) {
      // register가 존재하는 경우 null로 처리
      const realKey = this._toKey(key);
      this._data.get(realKey)?.set(null);
    }
  
    merge(key,remote) {
      // 각 키의 레지스터를 해당 키의 수신 상태와 재귀적으로 병합합니다.
      const realKey = this._toKey(key);
      const local = this._data.get(realKey);
      // 레지스터가 이미 존재하면 들어오는 상태와 병합합니다.
      if (local) {
        local.merge(remote);
      } else {
        // 그렇지 않으면, 들어오는 상태와 함께 새로운 `LWWRegister`를 인스턴스화합니다.
        this._data.set(realKey, new LWWRegister(remote));
      }
    }
  }
  

  export default LWWMap;