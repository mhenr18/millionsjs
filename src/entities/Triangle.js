
export default class Triangle {
    constructor(p1, p2, p3, zIndex) {
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
        this.zIndex = zIndex;
    }

    boundingBox() {
        var minX = Math.min(this.p1.x, Math.min(this.p2.x, this.p3.x));
        var minY = Math.min(this.p1.y, Math.min(this.p2.y, this.p3.y));
        var maxX = Math.max(this.p1.x, Math.max(this.p2.x, this.p3.x));
        var maxY = Math.max(this.p1.y, Math.max(this.p2.y, this.p3.y));

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
}
