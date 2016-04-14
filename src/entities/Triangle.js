
export default class Triangle {
    constructor(p1, p2, p3, zIndex) {
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
        this.zIndex = zIndex;
    }

    equals(rhs) {
        if (this == rhs) {
            return true;
        }

        if (!(rhs instanceof Triangle)) {
            return false;
        }

        return this.zIndex == rhs.zIndex
            && this.p1.x == rhs.p1.x
            && this.p1.y == rhs.p1.y
            && this.p2.x == rhs.p2.x
            && this.p2.y == rhs.p2.y
            && this.p3.x == rhs.p3.x
            && this.p3.y == rhs.p3.y
            && this.p1.color.equals(rhs.p1.color)
            && this.p2.color.equals(rhs.p2.color)
            && this.p3.color.equals(rhs.p3.color);
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
