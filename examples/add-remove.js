require('file?name=[name].[ext]!./add-remove.html');
require('./add-remove.scss');
let queryString = require('query-string');
let Millions = require('millions');
let canvas = document.querySelector('canvas');
let drawDelayEl = document.querySelector('.draw-delay');
let focalPoint = { x: 0, y: 0 };
let zoom = 1;
let currentColor = null;
let tempLine = null;

let getTimestamp = null;
if (window.performance.now) {
    console.log("Using high performance timer");
    getTimestamp = function() { return window.performance.now(); };
} else {
    if (window.performance.webkitNow) {
        console.log("Using webkit high performance timer");
        getTimestamp = function() { return window.performance.webkitNow(); };
    } else {
        console.log("Using low performance timer");
        getTimestamp = function() { return new Date().getTime(); };
    }
}

const parsed = queryString.parse(location.search);
let opts = {
    backgroundColor: Millions.Color.fromRGB(255, 255, 255)
};

if (parsed.pixelDensity) {
    opts.pixelDensity = window.parseFloat(parsed.pixelDensity);
}

let mctx = new Millions(canvas, opts);

window.requestAnimationFrame(function onFrame() {
    mctx.render(focalPoint, zoom, (function *() {
        if (tempLine) {
            yield tempLine;
        }
    })());
    window.requestAnimationFrame(onFrame);
});

// set up control listeners
for (let btn of document.querySelectorAll('.color-button')) {
    let color = btn.getAttribute('data-color');
    btn.style.backgroundColor = color;

    btn.onclick = () => {
        setColor(color);
    }
}

document.querySelector('.tools .draw').onclick = () => {
    draw();
};

document.querySelector('.tools .erase').onclick = () => {
    erase();
};

function tempLineLength() {
    let dx = tempLine.p1.x - tempLine.p2.x;
    let dy = tempLine.p1.y - tempLine.p2.y;

    return Math.sqrt(dx*dx + dy*dy);
}

function draw() {
    for (let btn of document.querySelectorAll('.tools button')) {
        btn.classList.remove('selected');
    }

    document.querySelector('.tools .draw').classList.add('selected');

    window.onmousedown = function (ev) {
        ev.preventDefault();

        let ctxCoords = mctx.clientToGlobal({ x: ev.clientX, y: ev.clientY}, focalPoint, zoom);

        tempLine = {
            p1: { x: ctxCoords.x,    y: ctxCoords.y,  capStyle: Millions.Line.CapStyles.ROUNDED },
            p2: { x: ctxCoords.x,    y: ctxCoords.y,  capStyle: Millions.Line.CapStyles.ROUNDED },
            thickness: 7,
            color: Millions.Color.fromCSS(currentColor)
        };

        window.onmousemove = function (ev) {
            ev.preventDefault();

            let ctxCoords = mctx.clientToGlobal({ x: ev.clientX, y: ev.clientY}, focalPoint, zoom);

            tempLine.p2.x = ctxCoords.x;
            tempLine.p2.y = ctxCoords.y;

            if (tempLineLength() > 5) {
                mctx.addLine(tempLine);
                tempLine.p1.x = tempLine.p2.x;
                tempLine.p1.y = tempLine.p2.y;
            }
        };

        window.onmouseup = function (ev) {
            ev.preventDefault();

            if (tempLineLength() > 2) {

                mctx.addLine(tempLine);
            }

            tempLine = null;

            window.onmousemove = null;
            window.onmouseup = null;
        };
    };
}

function erase() {
    for (let btn of document.querySelectorAll('.tools button')) {
        btn.classList.remove('selected');
    }

    document.querySelector('.tools .erase').classList.add('selected');
}

function undo() {

}

function redo() {

}

function setColor(colorStr) {
    currentColor = colorStr;

    for (let btn of document.querySelectorAll('.color-button')) {
        if (btn.getAttribute('data-color') == colorStr) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    }
}

draw();
setColor('#000');
