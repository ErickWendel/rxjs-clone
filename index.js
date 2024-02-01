// https://codepen.io/yguo/pen/OyYGxQ
// https://gist.github.com/escaroda/d3362b27709c24f15178b3ea90382788

import { fromEvent, switchMap, takeOnce } from "./operators.js";

const canvas = document.getElementById("sig-canvas");
const ctx = canvas.getContext("2d");
ctx.strokeStyle = "#222222";
ctx.lineWidth = 4;

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
    up: 'mouseup'
}

fromEvent(canvas, mouseEvents.down)
    .pipeThrough(
        switchMap(() =>
            fromEvent(canvas, mouseEvents.move)
                .pipeThrough(
                    takeOnce(canvas, mouseEvents.up)
                )
        )
    )

    .pipeTo(new WritableStream({
        write({ origin, active }) {
            this._lastPosition = this._lastPosition ?? origin;

            const [from, to] = [this._lastPosition, active].map(item => getMousePos(canvas, item))

            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();

            this._lastPosition = active.type === mouseEvents.up ? null : active
        }
    }))






