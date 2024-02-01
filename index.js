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
        switchMap((e) => {
            // return interval(1000)
            return fromEvent(canvas, mouseEvents.move)
                .pipeThrough(
                    takeOnce(canvas, mouseEvents.up)
                )
        })
    )
    // .pipeTo(new WritableStream({
    //     write(e) {
    //         console.log(e)
    //     }
    // }))

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
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();

        }
    }))
