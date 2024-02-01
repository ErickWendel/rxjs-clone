// https://codepen.io/yguo/pen/OyYGxQ
// https://gist.github.com/escaroda/d3362b27709c24f15178b3ea90382788

import { fromEvent, interval, map, switchMap, takeOnce } from "./operators.js";

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
            // interval(1000)
            fromEvent(canvas, mouseEvents.move)
                .pipeThrough(
                    takeOnce(canvas, mouseEvents.up)
                )
        )
    )
    .pipeThrough(
        map(function ({ origin, active }) {
            this._lastPosition = this._lastPosition ?? origin;

            const [from, to] = [this._lastPosition, active].map(item => getMousePos(canvas, item))
            this._lastPosition = active.type === mouseEvents.up ? null : active

            return { from, to }
        })
    )
    .pipeTo(new WritableStream({
        write({ from, to }) {
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();

        }
    }))
