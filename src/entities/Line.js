
export default class Line {
    constructor(p1, p2, zIndex) {
        this.p1 = p1;
        this.p2 = p2;
        this.zIndex = zIndex;
    }

    equals(rhs) {
        if (this == rhs) {
            return true;
        }

        if (!(rhs instanceof Line)) {
            return false;
        }

        return this.zIndex == rhs.zIndex
            && this.p1.x == rhs.p1.x
            && this.p1.y == rhs.p1.y
            && this.p2.x == rhs.p2.x
            && this.p2.y == rhs.p2.y
            && this.p1.thickness == rhs.p1.thickness
            && this.p2.thickness == rhs.p2.thickness
            && this.p1.color.equals(rhs.p1.color)
            && this.p2.color.equals(rhs.p2.color);
    }

    boundingBox() {
        var x, y, width, height;

        if (this.p1.x < this.p2.x) {
            x = this.p1.x;
            width = this.p2.x - this.p1.x;
        } else {
            x = this.p2.x;
            width = this.p1.x - this.p2.x;
        }

        if (this.p1.y < this.p2.y) {
            y = this.p1.y;
            height = this.p2.y - this.p1.y;
        } else {
            y = this.p2.y;
            height = this.p1.y - this.p2.y;
        }

        return { x, y, width, height };
    }
}
