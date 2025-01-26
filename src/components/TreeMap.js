
class TreeMap {
    constructor() {
      // (파싱된 키, 원본 문자열 키, 값) 형태로 보관
      this._entries = [];
    }

    arrayComparator(a, b){
        // a와 b를 앞에서부터 비교
        // 첫 번째로 다른 원소가 나오면 그 차이로 정렬 결정
        // 모든 원소가 같다면 길이로 결정 (짧은 배열이 앞선다)
        const minLen = Math.min(a.length, b.length);
            for (let i = 0; i < minLen; i++) {
            if (a[i] < b[i]) return -1;
            if (a[i] > b[i]) return 1;
        }
        // 여기까지 오면 앞쪽 원소들은 모두 동일
        return a.length - b.length;
    }
    parseKey(key) {
        // 예: key: "[17,2]" → 배열 [17, 2]
        // 양쪽 대괄대를 제거하고, 내용을 split
        const inner = key.slice(1, -1).trim(); // "[17,2]" → "17,2"
        if (!inner) {
          return []; // 빈 배열일 경우, 예: "[]"
        }
        

        return inner.split(",").map(numStr => parseInt(numStr, 10));
      }
  
    set(key, value) {
      // 키 문자열을 숫자 배열로 파싱
      const parsedKey = this.parseKey(key);
      
      // 이진 탐색으로 삽입할 위치를 찾는다
      let low = 0;
      let high = this._entries.length;
      
      while (low < high) {
        const mid = (low + high) >>> 1; // 중간 인덱스
        const cmp = this.arrayComparator(parsedKey, this._entries[mid].parsedKey);
        if (cmp === 0) {
          // 이미 존재하는 키이면 값만 갱신
          this._entries[mid].value = value;
          return;
        } else if (cmp < 0) {
          high = mid;
        } else {
          low = mid + 1;
        }
      }
  
      // 찾은 위치(low)에 새 (키, 값)을 삽입
      this._entries.splice(low, 0, { parsedKey, key, value });
    }
  
    get(key) {
      // get 연산도 이진 탐색으로 찾을 수 있음
      const parsedKey = this.parseKey(key);
      let low = 0;
      let high = this._entries.length;
      
      while (low < high) {
        const mid = (low + high) >>> 1;
        const cmp = this.arrayComparator(parsedKey, this._entries[mid].parsedKey);
        if (cmp === 0) {
          return this._entries[mid].value;
        } else if (cmp < 0) {
          high = mid;
        } else {
          low = mid + 1;
        }
      }
      return undefined; // 찾지 못함
    }
  
    // 정렬된 키 목록 반환
    keys() {
      return this._entries.map(e => e.key);
    }
  
    // 정렬된 값 목록 반환
    values() {
      return this._entries.map(e => e.value);
    }
  
    // (key, value) 쌍을 순서대로 반환
    entries() {
      return this._entries.map(e => [e.key, e.value]);
    }
  }
  
  export default TreeMap;