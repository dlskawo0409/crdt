class LSEQAllocator {
  constructor( base = 16) {
    this.base = base;
    this.random = Math.random;
  }

  computeBase(depth) {
    return this.base * Math.pow(2, depth);
  }

  alloc(p, q) {
    const [interval, depth] = this.sub(p,q);
    const step = Math.min(this.computeBase(depth), interval);
    // console.log("depth", depth, "interval", interval);
    // console.log("step" , step);

    let id;
    var val = Math.floor(Math.random() * (step)) +1;
    let appnedId = depth === p.length ? 0 : p[p.length-1];
    appnedId += val;
    id = this.prefix(p, appnedId, depth);

    return id;
  }

  prefix(p, appendId, depth) {
    let result = [];
    for(let i = 0; i<depth; i++){
      result[i] = p[i];
    }
    if(p.length === depth){
      result[depth] = appendId;
    }
    else{
      result[p.length-1] = appendId;
    }
    return result;
  }


  sub(p,q){ 
    var interval = 0;
    var depth = Math.min(p.length, q.length);
    for(let i = 0; i<depth; i++){
      // 둘 다 작으면
      if(i < p.length && i< q.length){
        var interval = q[i] - p[i] -1
        if(interval !==0 ){
          return [interval, i];
        }
      }
    }
    var len = p.length-1; //2
    // console.log("len", len);
    interval = this.computeBase(len) -  p[len];
    if(interval === 0 ){
      len++;
      interval = this.computeBase(len);
    }
    return [ interval , len];
  }

}

export default LSEQAllocator;