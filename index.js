// https://codepen.io/yguo/pen/OyYGxQ
// https://gist.github.com/escaroda/d3362b27709c24f15178b3ea90382788

import { combine, fromEvent, interval, map, switchMap, takeUntil } from "./operators.js";

const canvas = document.getElementById("sig-canvas");
const clearBtn = document.getElementById("clearBtn");
const ctx = canvas.getContext("2d");

const resetCanvas = () => {
    const parent = canvas.parentElement
    canvas.width = parent.clientWidth * 0.9
    canvas.height = parent.clientHeight * 2.5

    ctx.strokeStyle = "#222222";
    ctx.lineWidth = 4;
}
resetCanvas()

const getMousePos = (canvasDom, mouseEvent) => {
    const rect = canvasDom.getBoundingClientRect();
    return {
        x: mouseEvent.clientX - rect.left,
        y: mouseEvent.clientY - rect.top
    }
}
const mouseEvents = {
    down: 'mousedown',
    move: 'mousemove',
    up: 'mouseup',
    leave: 'mouseleave',
    touchstart: 'touchstart',
    touchmove: 'touchmove',
    touchend: 'touchend',
}
const touchToMouse = (touchEvent, mouseEvent) => {
    const [touch] = touchEvent.touches.length ?
        touchEvent.touches :
        touchEvent.changedTouches

    return new MouseEvent(mouseEvent, {
        clientX: touch.clientX,
        clientY: touch.clientY
    })
}

const db = []
function store(position) {
    db.unshift(position)
}
function getStore() {
    return db
}


combine([
    fromEvent(canvas, mouseEvents.down),
    fromEvent(canvas, mouseEvents.touchstart)
        .pipeThrough(map(e => touchToMouse(e, mouseEvents.down))),
])
    .pipeThrough(
        switchMap((e) => {
            return combine([
                fromEvent(canvas, mouseEvents.move),
                fromEvent(canvas, mouseEvents.touchmove)
                    .pipeThrough(map(e => touchToMouse(e, mouseEvents.move))),
            ])
                .pipeThrough(
                    takeUntil(
                        combine([
                            fromEvent(canvas, mouseEvents.up),
                            fromEvent(canvas, mouseEvents.leave),
                            fromEvent(canvas, mouseEvents.touchend)
                                .pipeThrough(map(e => touchToMouse(e, mouseEvents.up))),
                        ])
                    )
                )
        })
    )
    .pipeThrough(
        map(function ([mouseDown, mouseMove]) {
            this._lastPosition = this._lastPosition ?? mouseDown;

            const [from, to] = [this._lastPosition, mouseMove].map(item => getMousePos(canvas, item))
            this._lastPosition = mouseMove.type === mouseEvents.up ? null : mouseMove

            return { from, to }
        })
    )
    .pipeTo(new WritableStream({
        write({ from, to }) {
            store({ from, to })
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
        }
    }))

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

fromEvent(clearBtn, 'click')
    .pipeTo(new WritableStream({
        async write() {
            for (const { from, to } of getStore()) {
                // remove lines based on x  and y
                ctx.clearRect(from.x, from.y, canvas.width, canvas.height);

                await sleep(10)
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = canvas.width
            ctx.lineWidth = 4;
            db.length = 0
        }
    }))