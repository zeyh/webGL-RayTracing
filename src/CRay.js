function CRay() {
    //=============================================================================
    // Object for a ray in an unspecified coord. system (usually 'world' coords).
    this.orig = vec4.fromValues(0, 0, 0, 1); // Ray starting point (x,y,z,w)
    // (default: at origin
    this.dir = vec4.fromValues(0, 0, -1, 0); // The ray's direction vector
    // (default: look down -z axis)
}

CRay.prototype.printMe = function (name) {
    if (name == undefined) name = "[CRay]";
    var res = 3; // # of digits to display
    console.log(
        name +
            ".orig:" +
            this.orig[0].toFixed(res) +
            ",\t" +
            this.orig[1].toFixed(res) +
            ",\t" +
            this.orig[2].toFixed(res) +
            ",\t" +
            this.orig[3].toFixed(res) +
            "\n" +
            name +
            ".dir :" +
            this.dir[0].toFixed(res) +
            ",\t " +
            this.dir[1].toFixed(res) +
            ",\t " +
            this.dir[2].toFixed(res) +
            ",\t " +
            this.dir[3].toFixed(res) +
            "\n------------------------"
    );
};
