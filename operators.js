
const fromEvent = (target, eventName) => {
    let _listener;
    const readable = new ReadableStream({
        start(controller) {
            _listener = (e) => controller.enqueue(e)
            target.addEventListener(eventName, _listener)
        },
        cancel() {
            target.removeEventListener(eventName, _listener)
        }
    })

    return readable
}

const switchMap = (fn) => {
    return new TransformStream({
        transform(chunk, controller) {
            const stream = fn()
            // can be a readable or a TransformStream.readable
            const reader = (stream.readable || stream).getReader()

            return (async function read() {
                const { value, done } = await reader.read()
                if (done) return

                controller.enqueue({
                    origin: chunk,
                    active: value
                })
                return read()
            })()
        },
    })
}

const takeOnce = (canvas, eventName) => {
    return new TransformStream({
        start(controller) {
            const listener = function (e) {
                controller.enqueue(e)
                controller.terminate()
            }

            canvas.addEventListener(eventName, listener, { once: true })
        },
        transform(chunk, controller) {
            controller.enqueue(chunk)
        },
    })
}

const interval = (ms) => {
    let intervalId
    return new TransformStream({
        start(controller) {
            intervalId = setInterval(
                () =>
                    controller.enqueue(Date.now()),
                ms
            )
        },
        cancel() {
            clearInterval(intervalId)
        }
    })
}

const map = (fn) => {
    return new TransformStream({
        transform(chunk, controller) {
            controller.enqueue(fn.bind(fn)(chunk))
        }
    })
}

export {
    fromEvent,
    switchMap,
    takeOnce,
    interval,
    map,
}