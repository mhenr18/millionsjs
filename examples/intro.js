require('file?name=[name].[ext]!./intro.html');
require('./intro.scss');
let queryString = require('query-string');
let Millions = require('millions');
let canvas = document.querySelector('canvas');
let fpsLabel = document.querySelector('.fps');
let focalPoint = { x: 0, y: 0 };
let zoom = 1;
let framesInSecond = 0;

const parsed = queryString.parse(location.search);
let opts = {
    backgroundColor: Millions.Color.fromRGB(255, 255, 255)
};
if (parsed.pixelDensity) {
    opts.pixelDensity = window.parseFloat(parsed.pixelDensity);
}

let linesWide = 32;
let linesHigh = 32;

if (parsed.linesWide) {
    linesWide = window.parseInt(parsed.linesWide);
}

if (parsed.linesHigh) {
    linesHigh = window.parseInt(parsed.linesHigh);
}

let mctx = new Millions(canvas, opts);

let fpsCounterInterval = setInterval(() => {
    fpsLabel.innerHTML = "" + framesInSecond + " fps<br /> " + (linesWide * linesHigh) + " lines<br /> density = " + mctx.options.pixelDensity;
    framesInSecond = 0;
}, 1000);



window.requestAnimationFrame(function onFrame() {
    ++framesInSecond;
    mctx.render(focalPoint, zoom);

    window.requestAnimationFrame(onFrame);
});

focalPoint = { x: linesWide * 7.5, y: linesHigh * 7.5 };

for (let y = 0; y < linesHigh; ++y) {
    for (let x = 0; x < linesWide; ++x) {
        let x1 = x * 15, y1 = y * 15;

        mctx.addLine({
            p1: { x: x1,        y: y1,       capStyle: Millions.Line.CapStyles.ROUNDED },
            p2: { x: x1 + 10,   y: y1 + 10,  capStyle: Millions.Line.CapStyles.ROUNDED },
            thickness: 2,
            color: Millions.Color.fromRGB(0, 0, 0)
        });
    }
}

window.onmousedown = function (ev) {
    ev.preventDefault();

    let startingFocal = { x: focalPoint.x, y: focalPoint.y };
    let startingPos = { x: ev.offsetX, y: ev.offsetY };

    function updateFocalPoint(x, y) {
        let dx = startingPos.x - x;
        let dy = startingPos.y - y;

        focalPoint = {
            x: startingFocal.x + dx / zoom,
            y: startingFocal.y + dy / zoom
        };
    }

    window.onmousemove = function (ev) {
        ev.preventDefault();
        updateFocalPoint(ev.offsetX, ev.offsetY);
    };

    window.onmouseup = function (ev) {
        ev.preventDefault();
        updateFocalPoint(ev.offsetX, ev.offsetY);

        window.onmousemove = null;
        window.onmouseup = null;
    };
}

window.onmousewheel = function (ev) {
    ev.preventDefault();

    zoom *= 1 + ev.deltaY / 800;

    if (zoom < 0.02) {
        zoom = 0.02;
    }
};
