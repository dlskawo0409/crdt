class LWWRegister {
    constructor( state) {
      this.state = state;
    }
  
    get value() { 
      return this.state[1];
    }
  
    set(value) {
      // 로컬 ID로 피어 ID 설정, 로컬 타임스탬프를 1 증가시키고 값 설정
      this.state = [this.state[0] + 1, value];
    }
  
    merge(state) {
      const [remotePeer, remoteTimestamp] = state;
      const [localPeer, localTimestamp] = this.state;
      // 로컬 타임스탬프가 원격 타임스탬프보다 크면 들어오는 값을 무시
      if (localTimestamp > remoteTimestamp) return;
      // 타임스탬프는 동일하지만 로컬 피어 ID가 원격 피어 ID보다 크면 들어오는 값을 무시
      if (localTimestamp === remoteTimestamp && localPeer > remotePeer) return;
      // 그렇지 않으면 로컬 상태를 원격 상태로 덮어쓰기
      this.state = state;
    }
  }

  export default LWWRegister;