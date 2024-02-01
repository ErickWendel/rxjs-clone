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

let drawing = false;
let mousePos = {
    x: 0,
    y: 0
};
let lastPos = mousePos;


const store = {}
let currentId = ''
const storeStream = new TransformStream({
    transform(chunk, controller) {
        const item = store[chunk.id] ?? {}
        item[chunk.type] = chunk


        // if (chunk.type === 'started') {
        // } else if (chunk.type === 'ended') {
        //     store[chunk.id].push(chunk)
        //     controller.enqueue(store[chunk.id])
        // }
        controller.enqueue(store[chunk.id])
    }
})
let x = 0
const mouseClickStream = new ReadableStream({
    start(controller) {
        canvas.addEventListener("mousedown", function (e) {
            console.log('down')
            currentId = window.crypto.randomUUID()
            // drawing = true;
            lastPos = getMousePos(canvas, e);
            controller.enqueue({
                id: currentId,
                type: 'started',
                pos: lastPos,
                at: Date.now()
            })
        }, false);

        canvas.addEventListener("mouseup", function (e) {
            // drawing = true;

            const pos = getMousePos(canvas, e);
            // if (lastPos.x === pos.x && lastPos.y === pos.y) {
            //     return
            // }
            console.log('up')

            lastPos = pos
            controller.enqueue({
                type: 'ended',
                id: currentId,
                pos: lastPos,
                at: Date.now()
            })
        }, false);
    },
    pull(controller) {

    },

})

const takeUntil = (event) => new TransformStream({
    transform(chunk, controller) {
        if (chunk.type !== event) {
            console.log('chunk.type', chunk.type, chunk.type === 'ended')
            controller.enqueue(chunk)
        }
    }
})

const mouseMoveStream = (el, event) => new TransformStream({
    transform(from, controller) {
        console.log('from', from.type)
        // el.addEventListener(event, e => controller.enqueue(e))
        el.addEventListener(event, to => {
            controller.enqueue({
                from: from.pos,
                to: getMousePos(el, to),
                type: from.type
            })
        })
    },
})


// readable = mouse down -> start
// transform = mouse move -> from-to
// readable = mouse up -> end
// readable = draw

mouseClickStream
    .pipeThrough(mouseMoveStream(canvas, 'mousemove'))
    .pipeThrough(takeUntil('ended'))
    .pipeTo(new WritableStream({
        write(e) {
            // console.log(e)
        }
    }))


// mouseStream
//     .pipeTo(new WritableStream({
//         write(e) {
//             console.log(e)
//         }
//     }))

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

(function drawLoop() {
    requestAnimationFrame(drawLoop);
    renderCanvas();
})();


