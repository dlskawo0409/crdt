class LSEQAllocator {
  constructor( base = 16) {
    this.base = base;
    this.S = new Map();
    this.random = Math.random;
  }

  computeBase(depth) {
    return this.base * Math.pow(2, depth);
  }

  alloc(p, q) {
    let depth = 0;
    let interval = 0;

    // Determine the depth where interval >= 1
    while (interval < 1) {
      depth++;
      interval = this.prefix(q, depth) - this.prefix(p, depth) - 1;
    }
    const step = Math.min(this.computeBase(depth), interval);
  
    // Set random boolean for the depth if not already set
    if (!this.S.has(depth)) {
      const rand = Math.random() >= 0.5;
      this.S.set(depth, rand);
    }

    let id;
    if (this.S.get(depth)) { // boundary+
      const addVal = Math.floor(Math.random() * (step + 1)) + 1;
      id = this.prefix(p, depth) + addVal;
    } else { // boundary-
      const subVal = Math.floor(Math.random() * (step + 1)) + 1;
      id = this.prefix(q, depth) - subVal;
    }

    return this.convertToArray(id, depth);
  }

  prefix(id, depth) {
    let result = 0;
    for (let i = 0; i < depth; i++) {
      if (i < id.length) {
        result += id[i] << (8 * (depth - i - 1));
      } else {
        result += 0;
      }
    }
    return result;
  }

  convertToArray(id, depth) {
    const array = [];
    for (let i = 0; i < depth; i++) {
      const shift = 8 * (depth - i - 1);
      array.push((id >> shift) & 0xFF);
    }
    return array;
  }
}

export default LSEQAllocator;