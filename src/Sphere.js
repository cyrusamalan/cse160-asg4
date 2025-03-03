class Sphere {
    constructor() {
        Object.assign(this, {
            type: 'sphere',
            color: [1, 1, 1, 1],
            matrix: new Matrix4(),
            textureNum: -2,
            verts32: new Float32Array([])
        });
    }

    render() {
        const { color, textureNum, matrix } = this;
        gl.uniform1i(u_whichTexture, textureNum);
        gl.uniform4f(u_FragColor, ...color);
        gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);

        const scale = 0.5;
        const step = Math.PI / 10;

        for (let theta = 0; theta < Math.PI; theta += step) {
            for (let phi = 0; phi < 2 * Math.PI; phi += step) {
                let points = this._generateSpherePoints(theta, phi, step, scale);
                let uvCoords = this._generateUVCoords(theta, phi, step);

                gl.uniform4f(u_FragColor, 1, 1, 1, 1);
                drawTriangle3DUVNormal(points[0], uvCoords[0], points[0]);
                
                gl.uniform4f(u_FragColor, 1, 0, 0, 1);
                drawTriangle3DUVNormal(points[1], uvCoords[1], points[1]);
            }
        }
    }

    _generateSpherePoints(t, r, step, scale) {
        const sphereVertex = (theta, phi) => [
            scale * Math.sin(theta) * Math.cos(phi),
            scale * Math.sin(theta) * Math.sin(phi),
            scale * Math.cos(theta)
        ];
        
        return [
            [
                ...sphereVertex(t, r),
                ...sphereVertex(t + step, r),
                ...sphereVertex(t + step, r + step)
            ],
            [
                ...sphereVertex(t, r),
                ...sphereVertex(t + step, r + step),
                ...sphereVertex(t, r + step)
            ]
        ];
    }

    _generateUVCoords(t, r, step) {
        return [
            [
                t / Math.PI, r / (2 * Math.PI),
                (t + step) / Math.PI, r / (2 * Math.PI),
                (t + step) / Math.PI, (r + step) / (2 * Math.PI)
            ],
            [
                t / Math.PI, r / (2 * Math.PI),
                (t + step) / Math.PI, (r + step) / (2 * Math.PI),
                t / Math.PI, (r + step) / (2 * Math.PI)
            ]
        ];
    }
}
