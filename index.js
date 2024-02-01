// https://codepen.io/yguo/pen/OyYGxQ

// Set up the UI
const sigText = document.getElementById("sig-dataUrl");
const sigImage = document.getElementById("sig-image");
const clearBtn = document.getElementById("sig-clearBtn");
const submitBtn = document.getElementById("sig-submitBtn");

const canvas = document.getElementById("sig-canvas");
const ctx = canvas.getContext("2d");
ctx.strokeStyle = "#222222";
ctx.lineWidth = 4;

let lock = false
let drawing = false;
let mousePos = {
    x: 0,
    y: 0
};
let lastPos = mousePos;

const fromEvent = (target, eventName) => {
    let _listener;
    const readable = new ReadableStream({
        start(controller) {
            _listener = (e) => {
                controller.enqueue(e)
            }
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
        // mouse down
        transform(chunk, controller) {
            console.count('mousedown')
            return (async function read() {
                // mouse move
                const reader = fn().getReader()
                const { value, done } = await reader.read()
                if (done) {
                    return
                }

                // mousemove
                controller.enqueue({
                    origin: chunk,
                    active: value
                })
                return read()
            })()
        },
        flush(controller) {
            debugger
            console.log('flush')
        }
    })
}

const takeOnce = (canvas, eventName) => {
    let finished = false
    return new TransformStream({
        start(controller) {
            const listener = function (e) {
                console.count('takeUntil')
                controller.terminate()
                canvas.removeEventListener(eventName, listener)
                finished = true
            }

            canvas.addEventListener(eventName, listener)
        },
        transform(chunk, controller) {
            controller.enqueue(chunk)
            if(finished) {
                debugger
            }
        },
        flush(controller) {
            debugger
        }
    })


    // const t = new TransformStream({
    //     async transform(chunk, controller) {
    //         controller.enqueue(chunk)

    //         const reader = stream.getReader()

    //         reader.read()
    //             .then((once) => {
    //                 console.count('takeUntil')
    //                 controller.enqueue(once.value)

    //                 // stream.cancel()
    //                 controller.terminate()
    //             })


    //     }
    // })

    // return t
}

fromEvent(canvas, 'mousedown')
    .pipeThrough(
        switchMap(() => {
            return fromEvent(canvas, 'mousemove')
                .pipeThrough(
                    takeOnce(canvas, 'mouseup')
                )

        })
    )

    .pipeTo(new WritableStream({
        write({ origin, active }) {
            // console.log({
            //     origin,
            //     originType: origin?.type,
            //     active,
            //     activeType: active?.type,
            // })
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(active.x, active.y);
            ctx.stroke();
        }
    }))


canvas.addEventListener("mousedown", function (e) {
    drawing = true;
    lastPos = getMousePos(canvas, e);
}, false);

canvas.addEventListener("mouseup", function (e) {
    drawing = false;
}, false);

canvas.addEventListener("mousemove", function (e) {
    mousePos = getMousePos(canvas, e);
}, false);


function getMousePos(canvasDom, mouseEvent) {
    var rect = canvasDom.getBoundingClientRect();
    return {
        x: mouseEvent.clientX - rect.left,
        y: mouseEvent.clientY - rect.top
    }
}

function renderCanvas() {
    if (drawing) {
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
        lastPos = mousePos;
    }
}

// (function drawLoop() {
//     requestAnimationFrame(drawLoop);
//     renderCanvas();
// })();


