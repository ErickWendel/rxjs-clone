
/**
 *
 * @param {EventTarget} target
 * @param {string} eventName
 * @returns {ReadableStream}
 */
const fromEvent = (target, eventName) => {
    let _listener
    return new ReadableStream({
        start(controller) {
            _listener = (e) => controller.enqueue(e)
            target.addEventListener(eventName, _listener)
        },
        cancel() {
            target.removeEventListener(eventName, _listener)
        }
    })
}

/**
 * @param {Number} ms
 * @returns {ReadableStream}
 */
const interval = (ms) => {
    let _intervalId
    let i = 0
    return new ReadableStream({
        start(controller) {
            _intervalId = setInterval(() => {
                controller.enqueue(i++, Date.now())
            }, ms)
        },
        cancel() {
            clearInterval(_intervalId)
        }
    })
}


/**
 *
 * @param {Function} fn
 * @return {TransformStream}
 */
const map = (fn) => {
    return new TransformStream({
        transform(chunk, controller) {
            controller.enqueue(fn.bind(fn)(chunk))
        }
    })
}

/**
 *
 * @typedef {ReadableStream | TransformStream} Stream
 * @param {Stream[]} streams
 * @returns {ReadableStream}
 */
const merge = (streams) => {
    return new ReadableStream({
        async start(controller) {
            async function read(stream) {
                const reader = (stream.readable || stream).getReader()
                while (true) {
                    const { value, done } = await reader.read()
                    if (done) {
                        return;
                    }
                    controller.enqueue(value)
                }
            }
            await Promise.all(streams.map(stream => read(stream)))
            controller.terminate()
        }
    })
}

/**
 * @typedef {function(): ReadableStream | TransformStream} StreamFunction
 *
 * @param {StreamFunction} fn
 * @param {object} options
 * @param {boolean} options.pairwise
 *
 * @return {TransformStream}
 */
const switchMap = (fn, options = { pairwise: true }) => {
    let lastRead = undefined;
    return new TransformStream({
        // mousedown
        async transform(chunk, controller) {
            //switchMap garantee that only one inner substream is active
            if (lastRead) {
                lastRead.continue = false;
            }
            const stream = fn.bind(fn)(chunk)
           
            const reader = (stream.readable || stream).getReader()
            const read = async function () {
                // mousemove
                this.continue = true
                while (this.continue) {
                    const { value, done } = await reader.read()
                    const result = options.pairwise ? [chunk, value] : value
                    if (done) {
                        controller.terminate()
                        return;
                    }
                    if (this.continue) {
                        controller.enqueue(result)
                    }
                }
            }
            lastRead = read;
            read.bind(read)();
        }
    })
}

/**
 *
 * @param {ReadableStream | TransformStream} stream
 * @returns {TransformStream}
 */
const takeUntil = (stream) => {
    const readAndTerminate = async (stream, controller) => {
        const reader = (stream.readable || stream).getReader()
        const { value } = await reader.read()
        controller.enqueue(value)
        controller.terminate()
    }

    return new TransformStream({
        start(controller) {
            readAndTerminate(stream, controller)
        },
        transform(chunk, controller) {
            controller.enqueue(chunk)
        }
    })
}

export {
    fromEvent,
    interval,
    map,
    merge,
    switchMap,
    takeUntil,
}