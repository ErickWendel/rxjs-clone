import { fromEvent, interval, map, merge, switchMap, takeUntil } from "./operators.js"

const canvas = document.getElementById('canvas')
const clearBtn = document.getElementById('clearBtn')
const ctx = canvas.getContext('2d')

const mouseEvents = {
    down: 'mousedown',
    move: 'mousemove',
    up: 'mouseup',
    leave: 'mouseleave',

    touchstart: 'touchstart',
    touchmove: 'touchmove',
    touchend: 'touchend',

    click: 'click',
}

const getMousePosition = (canvasDom, eventValue) => {
    const rect = canvasDom.getBoundingClientRect()
    return {
        x: eventValue.clientX - rect.left,
        y: eventValue.clientY - rect.top,
    }

}
const resetCanvas = (width, height) => {
    const parent = canvas.parentElement
    canvas.width = width || parent.clientWidth * 0.9
    canvas.height = height || parent.clientHeight * 1.5

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = 'green'
    ctx.lineWidth = 4
    startDrawing()
}


const sleep = (ms) => new Promise(r => setTimeout(r, ms))

const store = {
    db: [],
    get() {
        return this.db
    },
    set(item) {
        this.db.unshift(item)
    },
    clear() {
        this.db.length = 0
    }
}

const touchToMouse = (touchEvent, mouseEvent) => {
    const [touch] = touchEvent.touches.length ?
        touchEvent.touches :
        touchEvent.changedTouches

    return new MouseEvent(mouseEvent, {
        clientX: touch.clientX,
        clientY: touch.clientY,
    })

}

const startDrawing = () => {


    merge([
        fromEvent(canvas, mouseEvents.down),
        fromEvent(canvas, mouseEvents.touchstart)
            .pipeThrough(map(e => touchToMouse(e, mouseEvents.touchstart)))
    ])
        .pipeThrough(
            switchMap(e => {
                return merge([
                    fromEvent(canvas, mouseEvents.move),
                    fromEvent(canvas, mouseEvents.touchmove)
                        .pipeThrough(map(e => touchToMouse(e, mouseEvents.move)))
                ])
                    .pipeThrough(
                        takeUntil(
                            merge([
                                fromEvent(canvas, mouseEvents.up),
                                fromEvent(canvas, mouseEvents.leave),
                                fromEvent(canvas, mouseEvents.touchend)
                                    .pipeThrough(map(e => touchToMouse(e, mouseEvents.up)))
                            ])
                        )
                    )
                // / }, { pairwise: false })
            })

        )

        .pipeThrough(
            map(function ([mouseDown, mouseMove]) {
                this._lastPosition = this._lastPosition ?? mouseDown

                const [from, to] = [this._lastPosition, mouseMove]
                    .map(item => getMousePosition(canvas, item))

                this._lastPosition = mouseMove.type === mouseEvents.up ?
                    null :
                    mouseMove

                return { from, to }
            })
        )
        .pipeTo(new WritableStream({
            write({ from, to }) {
                store.set({ from, to })
                ctx.moveTo(from.x, from.y)
                ctx.lineTo(to.x, to.y)
                ctx.stroke()
            }
        }))
}
// clear

fromEvent(clearBtn, mouseEvents.click)
    .pipeTo(new WritableStream({
        async write(chunk) {
            ctx.beginPath()
            ctx.strokeStyle = 'white'

            for (const { from, to } of store.get()) {
                ctx.moveTo(from.x, from.y)
                ctx.lineTo(to.x, to.y)
                ctx.stroke()

                await sleep(5)
            }
            resetCanvas(canvas.width, canvas.height)
            store.clear()
        }
    }))

resetCanvas()
