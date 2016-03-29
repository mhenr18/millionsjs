
exports.padRect = function (rect, padding) {
    return {
        x: rect.x - padding,
        y: rect.y - padding,
        width: rect.width + 2 * padding,
        height: rect.height + 2 * padding
    }
};
