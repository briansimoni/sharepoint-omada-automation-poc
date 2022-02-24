const fs = require('fs')

class Queue {
  constructor () {
    const f = fs.readFileSync('queue.json')
    this.queue = JSON.parse(f)
  }

  getQueue () {
    return this.queue
  }

  saveQueue () {
    const data = JSON.stringify(this.queue)
    fs.writeFileSync('queue.json', data)
  }

  enqueue (item) {
    this.queue.push(item)
    this.saveQueue()
  }

  dequeue () {
    const item = this.queue.shift()
    this.saveQueue()
    return item
  }

  isEmpty () {
    return this.queue.length === 0
  }

  peek () {
    return this.queue[0]
  }
}

module.exports = {
  Queue
}
