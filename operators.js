
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
            const reader = fn().getReader()

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
                canvas.removeEventListener(eventName, listener)
            }

            canvas.addEventListener(eventName, listener)
        },
        transform(chunk, controller) {
            controller.enqueue(chunk)
        },
    })
}

export {
    fromEvent,
    switchMap,
    takeOnce
}