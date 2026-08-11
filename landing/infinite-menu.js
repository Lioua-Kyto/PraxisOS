/* =========================================================================
   InfiniteMenu — a draggable sphere of image discs (WebGL2).

   Ported from the React Bits "InfiniteMenu" component (JavaScript + CSS
   variant). The rendering core (Geometry / ArcballControl / InfiniteGridMenu)
   is framework-agnostic and is kept faithful to the original; only the React
   wrapper is replaced with the vanilla `mountInfiniteMenu` at the bottom.

   Deviations from the original, and why:
     - `gl-matrix` comes from a CDN global instead of an ESM import, since this
       page has no bundler.
     - The context is created with `alpha: true` and cleared transparent, so the
       sphere sits over the page background rather than on an opaque black box.
     - Atlas cells are filled with a centre-crop ("cover") of each source image.
       The originals are 16:9 screenshots and the atlas cells are square, so a
       plain draw would squash them.
   ========================================================================= */
(function (global) {
  "use strict";

  if (!global.glMatrix) return; // CDN missing; caller falls back to the grid
  var mat4 = global.glMatrix.mat4,
    quat = global.glMatrix.quat,
    vec2 = global.glMatrix.vec2,
    vec3 = global.glMatrix.vec3;

  var discVertShaderSource = `#version 300 es

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uCameraPosition;
uniform vec4 uRotationAxisVelocity;

in vec3 aModelPosition;
in vec3 aModelNormal;
in vec2 aModelUvs;
in mat4 aInstanceMatrix;

out vec2 vUvs;
out float vAlpha;
flat out int vInstanceId;

#define PI 3.141593

void main() {
    vec4 worldPosition = uWorldMatrix * aInstanceMatrix * vec4(aModelPosition, 1.);

    vec3 centerPos = (uWorldMatrix * aInstanceMatrix * vec4(0., 0., 0., 1.)).xyz;
    float radius = length(centerPos.xyz);

    if (gl_VertexID > 0) {
        vec3 rotationAxis = uRotationAxisVelocity.xyz;
        float rotationVelocity = min(.15, uRotationAxisVelocity.w * 15.);
        vec3 stretchDir = normalize(cross(centerPos, rotationAxis));
        vec3 relativeVertexPos = normalize(worldPosition.xyz - centerPos);
        float strength = dot(stretchDir, relativeVertexPos);
        float invAbsStrength = min(0., abs(strength) - 1.);
        strength = rotationVelocity * sign(strength) * abs(invAbsStrength * invAbsStrength * invAbsStrength + 1.);
        worldPosition.xyz += stretchDir * strength;
    }

    worldPosition.xyz = radius * normalize(worldPosition.xyz);

    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;

    vAlpha = smoothstep(0.5, 1., normalize(worldPosition.xyz).z) * .9 + .1;
    vUvs = aModelUvs;
    vInstanceId = gl_InstanceID;
}
`;

  var discFragShaderSource = `#version 300 es
precision highp float;

uniform sampler2D uTex;
uniform int uItemCount;
uniform int uAtlasSize;

out vec4 outColor;

in vec2 vUvs;
in float vAlpha;
flat in int vInstanceId;

void main() {
    int itemIndex = vInstanceId % uItemCount;
    int cellsPerRow = uAtlasSize;
    int cellX = itemIndex % cellsPerRow;
    int cellY = itemIndex / cellsPerRow;
    vec2 cellSize = vec2(1.0) / vec2(float(cellsPerRow));
    vec2 cellOffset = vec2(float(cellX), float(cellY)) * cellSize;

    ivec2 texSize = textureSize(uTex, 0);
    float imageAspect = float(texSize.x) / float(texSize.y);
    float containerAspect = 1.0;

    float scale = max(imageAspect / containerAspect,
                     containerAspect / imageAspect);

    vec2 st = vec2(vUvs.x, 1.0 - vUvs.y);
    st = (st - 0.5) * scale + 0.5;

    st = clamp(st, 0.0, 1.0);

    st = st * cellSize + cellOffset;

    outColor = texture(uTex, st);
    outColor.a *= vAlpha;
}
`;

  function Face(a, b, c) { this.a = a; this.b = b; this.c = c; }

  function Vertex(x, y, z) {
    this.position = vec3.fromValues(x, y, z);
    this.normal = vec3.create();
    this.uv = vec2.create();
  }

  class Geometry {
    constructor() { this.vertices = []; this.faces = []; }
    addVertex() {
      var args = arguments;
      for (var i = 0; i < args.length; i += 3) {
        this.vertices.push(new Vertex(args[i], args[i + 1], args[i + 2]));
      }
      return this;
    }
    addFace() {
      var args = arguments;
      for (var i = 0; i < args.length; i += 3) {
        this.faces.push(new Face(args[i], args[i + 1], args[i + 2]));
      }
      return this;
    }
    get lastVertex() { return this.vertices[this.vertices.length - 1]; }
    subdivide(divisions) {
      divisions = divisions || 1;
      var midPointCache = {};
      var f = this.faces;
      var self = this;
      for (var div = 0; div < divisions; ++div) {
        var newFaces = new Array(f.length * 4);
        f.forEach(function (face, ndx) {
          var mAB = self.getMidPoint(face.a, face.b, midPointCache);
          var mBC = self.getMidPoint(face.b, face.c, midPointCache);
          var mCA = self.getMidPoint(face.c, face.a, midPointCache);
          var i = ndx * 4;
          newFaces[i + 0] = new Face(face.a, mAB, mCA);
          newFaces[i + 1] = new Face(face.b, mBC, mAB);
          newFaces[i + 2] = new Face(face.c, mCA, mBC);
          newFaces[i + 3] = new Face(mAB, mBC, mCA);
        });
        f = newFaces;
      }
      this.faces = f;
      return this;
    }
    spherize(radius) {
      radius = radius || 1;
      this.vertices.forEach(function (vertex) {
        vec3.normalize(vertex.normal, vertex.position);
        vec3.scale(vertex.position, vertex.normal, radius);
      });
      return this;
    }
    get data() {
      return { vertices: this.vertexData, indices: this.indexData, normals: this.normalData, uvs: this.uvData };
    }
    get vertexData() {
      return new Float32Array(this.vertices.flatMap(function (v) { return Array.from(v.position); }));
    }
    get normalData() {
      return new Float32Array(this.vertices.flatMap(function (v) { return Array.from(v.normal); }));
    }
    get uvData() {
      return new Float32Array(this.vertices.flatMap(function (v) { return Array.from(v.uv); }));
    }
    get indexData() {
      return new Uint16Array(this.faces.flatMap(function (f) { return [f.a, f.b, f.c]; }));
    }
    getMidPoint(ndxA, ndxB, cache) {
      var cacheKey = ndxA < ndxB ? "k_" + ndxB + "_" + ndxA : "k_" + ndxA + "_" + ndxB;
      if (Object.prototype.hasOwnProperty.call(cache, cacheKey)) return cache[cacheKey];
      var a = this.vertices[ndxA].position;
      var b = this.vertices[ndxB].position;
      var ndx = this.vertices.length;
      cache[cacheKey] = ndx;
      this.addVertex((a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, (a[2] + b[2]) * 0.5);
      return ndx;
    }
  }

  class IcosahedronGeometry extends Geometry {
    constructor() {
      super();
      var t = Math.sqrt(5) * 0.5 + 0.5;
      this.addVertex(
        -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0,
        0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t,
        t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1
      ).addFace(
        0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11,
        1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
        3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9,
        4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1
      );
    }
  }

  class DiscGeometry extends Geometry {
    constructor(steps, radius) {
      super();
      steps = Math.max(4, steps || 4);
      radius = radius || 1;
      var alpha = (2 * Math.PI) / steps;
      this.addVertex(0, 0, 0);
      this.lastVertex.uv[0] = 0.5;
      this.lastVertex.uv[1] = 0.5;
      for (var i = 0; i < steps; ++i) {
        var x = Math.cos(alpha * i);
        var y = Math.sin(alpha * i);
        this.addVertex(radius * x, radius * y, 0);
        this.lastVertex.uv[0] = x * 0.5 + 0.5;
        this.lastVertex.uv[1] = y * 0.5 + 0.5;
        if (i > 0) this.addFace(0, i, i + 1);
      }
      this.addFace(0, steps, 1);
    }
  }

  function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  function createProgram(gl, shaderSources, transformFeedbackVaryings, attribLocations) {
    var program = gl.createProgram();
    [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].forEach(function (type, ndx) {
      var shader = createShader(gl, type, shaderSources[ndx]);
      if (shader) gl.attachShader(program, shader);
    });
    if (transformFeedbackVaryings) {
      gl.transformFeedbackVaryings(program, transformFeedbackVaryings, gl.SEPARATE_ATTRIBS);
    }
    if (attribLocations) {
      for (var attrib in attribLocations) gl.bindAttribLocation(program, attribLocations[attrib], attrib);
    }
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  function makeVertexArray(gl, bufLocNumElmPairs, indices) {
    var va = gl.createVertexArray();
    gl.bindVertexArray(va);
    for (var i = 0; i < bufLocNumElmPairs.length; i++) {
      var buffer = bufLocNumElmPairs[i][0], loc = bufLocNumElmPairs[i][1], numElem = bufLocNumElmPairs[i][2];
      if (loc === -1) continue;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, numElem, gl.FLOAT, false, 0, 0);
    }
    if (indices) {
      var indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    }
    gl.bindVertexArray(null);
    return va;
  }

  function resizeCanvasToDisplaySize(canvas) {
    var dpr = Math.min(2, window.devicePixelRatio);
    var displayWidth = Math.round(canvas.clientWidth * dpr);
    var displayHeight = Math.round(canvas.clientHeight * dpr);
    var needResize = canvas.width !== displayWidth || canvas.height !== displayHeight;
    if (needResize) { canvas.width = displayWidth; canvas.height = displayHeight; }
    return needResize;
  }

  function makeBuffer(gl, sizeOrData, usage) {
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, sizeOrData, usage);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return buf;
  }

  function createAndSetupTexture(gl, minFilter, magFilter, wrapS, wrapT) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
    return texture;
  }

  class ArcballControl {
    constructor(canvas, updateCallback) {
      this.isPointerDown = false;
      this.orientation = quat.create();
      this.pointerRotation = quat.create();
      this.rotationVelocity = 0;
      this.rotationAxis = vec3.fromValues(1, 0, 0);
      this.snapDirection = vec3.fromValues(0, 0, -1);
      this.snapTargetDirection = null;
      this.EPSILON = 0.1;
      this.IDENTITY_QUAT = quat.create();

      this.canvas = canvas;
      this.updateCallback = updateCallback || function () { return null; };
      this.pointerPos = vec2.create();
      this.previousPointerPos = vec2.create();
      this._rotationVelocity = 0;
      this._combinedQuat = quat.create();

      var self = this;
      canvas.addEventListener("pointerdown", function (e) {
        vec2.set(self.pointerPos, e.clientX, e.clientY);
        vec2.copy(self.previousPointerPos, self.pointerPos);
        self.isPointerDown = true;
      });
      canvas.addEventListener("pointerup", function () { self.isPointerDown = false; });
      canvas.addEventListener("pointerleave", function () { self.isPointerDown = false; });
      canvas.addEventListener("pointermove", function (e) {
        if (self.isPointerDown) vec2.set(self.pointerPos, e.clientX, e.clientY);
      });
      canvas.style.touchAction = "none";
    }

    update(deltaTime, targetFrameDuration) {
      targetFrameDuration = targetFrameDuration || 16;
      var timeScale = deltaTime / targetFrameDuration + 0.00001;
      var angleFactor = timeScale;
      var snapRotation = quat.create();

      if (this.isPointerDown) {
        var INTENSITY = 0.3 * timeScale;
        var ANGLE_AMPLIFICATION = 5 / timeScale;
        var midPointerPos = vec2.sub(vec2.create(), this.pointerPos, this.previousPointerPos);
        vec2.scale(midPointerPos, midPointerPos, INTENSITY);

        if (vec2.sqrLen(midPointerPos) > this.EPSILON) {
          vec2.add(midPointerPos, this.previousPointerPos, midPointerPos);
          var p = this.project(midPointerPos);
          var q = this.project(this.previousPointerPos);
          var a = vec3.normalize(vec3.create(), p);
          var b = vec3.normalize(vec3.create(), q);
          vec2.copy(this.previousPointerPos, midPointerPos);
          angleFactor *= ANGLE_AMPLIFICATION;
          this.quatFromVectors(a, b, this.pointerRotation, angleFactor);
        } else {
          quat.slerp(this.pointerRotation, this.pointerRotation, this.IDENTITY_QUAT, INTENSITY);
        }
      } else {
        var INTENSITY2 = 0.1 * timeScale;
        quat.slerp(this.pointerRotation, this.pointerRotation, this.IDENTITY_QUAT, INTENSITY2);
        if (this.snapTargetDirection) {
          var SNAPPING_INTENSITY = 0.2;
          var a2 = this.snapTargetDirection;
          var b2 = this.snapDirection;
          var sqrDist = vec3.squaredDistance(a2, b2);
          var distanceFactor = Math.max(0.1, 1 - sqrDist * 10);
          angleFactor *= SNAPPING_INTENSITY * distanceFactor;
          this.quatFromVectors(a2, b2, snapRotation, angleFactor);
        }
      }

      var combinedQuat = quat.multiply(quat.create(), snapRotation, this.pointerRotation);
      this.orientation = quat.multiply(quat.create(), combinedQuat, this.orientation);
      quat.normalize(this.orientation, this.orientation);

      var RA_INTENSITY = 0.8 * timeScale;
      quat.slerp(this._combinedQuat, this._combinedQuat, combinedQuat, RA_INTENSITY);
      quat.normalize(this._combinedQuat, this._combinedQuat);

      var rad = Math.acos(this._combinedQuat[3]) * 2.0;
      var s = Math.sin(rad / 2.0);
      var rv = 0;
      if (s > 0.000001) {
        rv = rad / (2 * Math.PI);
        this.rotationAxis[0] = this._combinedQuat[0] / s;
        this.rotationAxis[1] = this._combinedQuat[1] / s;
        this.rotationAxis[2] = this._combinedQuat[2] / s;
      }

      var RV_INTENSITY = 0.5 * timeScale;
      this._rotationVelocity += (rv - this._rotationVelocity) * RV_INTENSITY;
      this.rotationVelocity = this._rotationVelocity / timeScale;

      this.updateCallback(deltaTime);
    }

    quatFromVectors(a, b, out, angleFactor) {
      angleFactor = angleFactor === undefined ? 1 : angleFactor;
      var axis = vec3.cross(vec3.create(), a, b);
      vec3.normalize(axis, axis);
      var d = Math.max(-1, Math.min(1, vec3.dot(a, b)));
      var angle = Math.acos(d) * angleFactor;
      quat.setAxisAngle(out, axis, angle);
      return { q: out, axis: axis, angle: angle };
    }

    project(pos) {
      var r = 2;
      var w = this.canvas.clientWidth;
      var h = this.canvas.clientHeight;
      var s = Math.max(w, h) - 1;
      var x = (2 * pos[0] - w - 1) / s;
      var y = (2 * pos[1] - h - 1) / s;
      var z = 0;
      var xySq = x * x + y * y;
      var rSq = r * r;
      if (xySq <= rSq / 2.0) z = Math.sqrt(rSq - xySq);
      else z = rSq / Math.sqrt(xySq);
      return vec3.fromValues(-x, y, z);
    }
  }

  class InfiniteGridMenu {
    constructor(canvas, items, onActiveItemChange, onMovementChange, onInit, scale) {
      this.TARGET_FRAME_DURATION = 1000 / 60;
      this.SPHERE_RADIUS = 2;
      this._time = 0;
      this._deltaTime = 0;
      this._deltaFrames = 0;
      this._frames = 0;
      this.camera = {
        matrix: mat4.create(), near: 0.1, far: 40, fov: Math.PI / 4, aspect: 1,
        position: vec3.fromValues(0, 0, 3), up: vec3.fromValues(0, 1, 0),
        matrices: { view: mat4.create(), projection: mat4.create(), inversProjection: mat4.create() }
      };
      this.nearestVertexIndex = null;
      this.smoothRotationVelocity = 0;
      this.scaleFactor = scale === undefined ? 1.0 : scale;
      this.movementActive = false;
      this.running = false;

      this.canvas = canvas;
      this.items = items || [];
      this.onActiveItemChange = onActiveItemChange || function () {};
      this.onMovementChange = onMovementChange || function () {};
      this.camera.position[2] = 3 * this.scaleFactor;
      this.init(onInit);
    }

    resize() {
      this.viewportSize = vec2.set(this.viewportSize || vec2.create(), this.canvas.clientWidth, this.canvas.clientHeight);
      var gl = this.gl;
      if (resizeCanvasToDisplaySize(gl.canvas)) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      }
      this.updateProjectionMatrix(gl);
    }

    run(time) {
      time = time || 0;
      this._deltaTime = Math.min(32, time - this._time);
      this._time = time;
      this._deltaFrames = this._deltaTime / this.TARGET_FRAME_DURATION;
      this._frames += this._deltaFrames;
      this.animate(this._deltaTime);
      this.render();
      var self = this;
      requestAnimationFrame(function (t) { self.run(t); });
    }

    init(onInit) {
      this.gl = this.canvas.getContext("webgl2", { antialias: true, alpha: true });
      var gl = this.gl;
      if (!gl) throw new Error("No WebGL 2 context!");

      this.viewportSize = vec2.fromValues(this.canvas.clientWidth, this.canvas.clientHeight);
      this.drawBufferSize = vec2.clone(this.viewportSize);

      this.discProgram = createProgram(gl, [discVertShaderSource, discFragShaderSource], null, {
        aModelPosition: 0, aModelNormal: 1, aModelUvs: 2, aInstanceMatrix: 3
      });

      this.discLocations = {
        aModelPosition: gl.getAttribLocation(this.discProgram, "aModelPosition"),
        aModelUvs: gl.getAttribLocation(this.discProgram, "aModelUvs"),
        aInstanceMatrix: gl.getAttribLocation(this.discProgram, "aInstanceMatrix"),
        uWorldMatrix: gl.getUniformLocation(this.discProgram, "uWorldMatrix"),
        uViewMatrix: gl.getUniformLocation(this.discProgram, "uViewMatrix"),
        uProjectionMatrix: gl.getUniformLocation(this.discProgram, "uProjectionMatrix"),
        uCameraPosition: gl.getUniformLocation(this.discProgram, "uCameraPosition"),
        uScaleFactor: gl.getUniformLocation(this.discProgram, "uScaleFactor"),
        uRotationAxisVelocity: gl.getUniformLocation(this.discProgram, "uRotationAxisVelocity"),
        uTex: gl.getUniformLocation(this.discProgram, "uTex"),
        uFrames: gl.getUniformLocation(this.discProgram, "uFrames"),
        uItemCount: gl.getUniformLocation(this.discProgram, "uItemCount"),
        uAtlasSize: gl.getUniformLocation(this.discProgram, "uAtlasSize")
      };

      this.discGeo = new DiscGeometry(56, 1);
      this.discBuffers = this.discGeo.data;
      this.discVAO = makeVertexArray(gl, [
        [makeBuffer(gl, this.discBuffers.vertices, gl.STATIC_DRAW), this.discLocations.aModelPosition, 3],
        [makeBuffer(gl, this.discBuffers.uvs, gl.STATIC_DRAW), this.discLocations.aModelUvs, 2]
      ], this.discBuffers.indices);

      this.icoGeo = new IcosahedronGeometry();
      this.icoGeo.subdivide(1).spherize(this.SPHERE_RADIUS);
      this.instancePositions = this.icoGeo.vertices.map(function (v) { return v.position; });
      this.DISC_INSTANCE_COUNT = this.icoGeo.vertices.length;
      this.initDiscInstances(this.DISC_INSTANCE_COUNT);

      this.worldMatrix = mat4.create();
      this.initTexture();

      var self = this;
      this.control = new ArcballControl(this.canvas, function (dt) { self.onControlUpdate(dt); });

      this.updateCameraMatrix();
      this.updateProjectionMatrix(gl);
      this.resize();

      if (onInit) onInit(this);
    }

    initTexture() {
      var gl = this.gl;
      var self = this;
      this.tex = createAndSetupTexture(gl, gl.LINEAR_MIPMAP_LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);

      var itemCount = Math.max(1, this.items.length);
      this.atlasSize = Math.ceil(Math.sqrt(itemCount));
      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");
      // Cells were 512px, which was the ceiling on how sharp a disc could get.
      // Take as much as the GPU allows, capped at 1024 per cell.
      var maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
      var cellSize = Math.min(1024, Math.floor(maxTex / this.atlasSize));

      canvas.width = this.atlasSize * cellSize;
      canvas.height = this.atlasSize * cellSize;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      Promise.all(this.items.map(function (item) {
        return new Promise(function (resolve) {
          var img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = function () { resolve(img); };
          img.onerror = function () { resolve(null); };
          img.src = item.image;
        });
      })).then(function (images) {
        images.forEach(function (img, i) {
          if (!img) return;
          var x = (i % self.atlasSize) * cellSize;
          var y = Math.floor(i / self.atlasSize) * cellSize;
          // Centre-crop to fill the square cell: the sources are 16:9, and a
          // straight draw into a square cell would squash them.
          var side = Math.min(img.width, img.height);
          var sx = (img.width - side) / 2;
          var sy = (img.height - side) / 2;
          ctx.drawImage(img, sx, sy, side, side, x, y, cellSize, cellSize);
        });
        gl.bindTexture(gl.TEXTURE_2D, self.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.generateMipmap(gl.TEXTURE_2D);
      });
    }

    initDiscInstances(count) {
      var gl = this.gl;
      this.discInstances = {
        matricesArray: new Float32Array(count * 16),
        matrices: [],
        buffer: gl.createBuffer()
      };
      for (var i = 0; i < count; ++i) {
        var instanceMatrixArray = new Float32Array(this.discInstances.matricesArray.buffer, i * 16 * 4, 16);
        instanceMatrixArray.set(mat4.create());
        this.discInstances.matrices.push(instanceMatrixArray);
      }
      gl.bindVertexArray(this.discVAO);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.discInstances.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.discInstances.matricesArray.byteLength, gl.DYNAMIC_DRAW);
      var mat4AttribSlotCount = 4;
      var bytesPerMatrix = 16 * 4;
      for (var j = 0; j < mat4AttribSlotCount; ++j) {
        var loc = this.discLocations.aInstanceMatrix + j;
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, bytesPerMatrix, j * 4 * 4);
        gl.vertexAttribDivisor(loc, 1);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindVertexArray(null);
    }

    animate(deltaTime) {
      var gl = this.gl;
      var self = this;
      this.control.update(deltaTime, this.TARGET_FRAME_DURATION);

      var positions = this.instancePositions.map(function (p) {
        return vec3.transformQuat(vec3.create(), p, self.control.orientation);
      });
      var scale = 0.25;
      var SCALE_INTENSITY = 0.6;
      positions.forEach(function (p, ndx) {
        var s = (Math.abs(p[2]) / self.SPHERE_RADIUS) * SCALE_INTENSITY + (1 - SCALE_INTENSITY);
        var finalScale = s * scale;
        var matrix = mat4.create();
        mat4.multiply(matrix, matrix, mat4.fromTranslation(mat4.create(), vec3.negate(vec3.create(), p)));
        mat4.multiply(matrix, matrix, mat4.targetTo(mat4.create(), [0, 0, 0], p, [0, 1, 0]));
        mat4.multiply(matrix, matrix, mat4.fromScaling(mat4.create(), [finalScale, finalScale, finalScale]));
        mat4.multiply(matrix, matrix, mat4.fromTranslation(mat4.create(), [0, 0, -self.SPHERE_RADIUS]));
        mat4.copy(self.discInstances.matrices[ndx], matrix);
      });

      gl.bindBuffer(gl.ARRAY_BUFFER, this.discInstances.buffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.discInstances.matricesArray);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      this.smoothRotationVelocity = this.control.rotationVelocity;
    }

    render() {
      var gl = this.gl;
      gl.useProgram(this.discProgram);
      gl.enable(gl.CULL_FACE);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.uniformMatrix4fv(this.discLocations.uWorldMatrix, false, this.worldMatrix);
      gl.uniformMatrix4fv(this.discLocations.uViewMatrix, false, this.camera.matrices.view);
      gl.uniformMatrix4fv(this.discLocations.uProjectionMatrix, false, this.camera.matrices.projection);
      gl.uniform3f(this.discLocations.uCameraPosition,
        this.camera.position[0], this.camera.position[1], this.camera.position[2]);
      gl.uniform4f(this.discLocations.uRotationAxisVelocity,
        this.control.rotationAxis[0], this.control.rotationAxis[1], this.control.rotationAxis[2],
        this.smoothRotationVelocity * 1.1);

      gl.uniform1i(this.discLocations.uItemCount, this.items.length);
      gl.uniform1i(this.discLocations.uAtlasSize, this.atlasSize);
      gl.uniform1f(this.discLocations.uFrames, this._frames);
      gl.uniform1f(this.discLocations.uScaleFactor, this.scaleFactor);
      gl.uniform1i(this.discLocations.uTex, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.tex);

      gl.bindVertexArray(this.discVAO);
      gl.drawElementsInstanced(gl.TRIANGLES, this.discBuffers.indices.length, gl.UNSIGNED_SHORT, 0, this.DISC_INSTANCE_COUNT);
    }

    updateCameraMatrix() {
      mat4.targetTo(this.camera.matrix, this.camera.position, [0, 0, 0], this.camera.up);
      mat4.invert(this.camera.matrices.view, this.camera.matrix);
    }

    updateProjectionMatrix(gl) {
      this.camera.aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      var height = this.SPHERE_RADIUS * 0.35;
      var distance = this.camera.position[2];
      if (this.camera.aspect > 1) this.camera.fov = 2 * Math.atan(height / distance);
      else this.camera.fov = 2 * Math.atan(height / this.camera.aspect / distance);
      mat4.perspective(this.camera.matrices.projection, this.camera.fov, this.camera.aspect, this.camera.near, this.camera.far);
      mat4.invert(this.camera.matrices.inversProjection, this.camera.matrices.projection);
    }

    onControlUpdate(deltaTime) {
      var timeScale = deltaTime / this.TARGET_FRAME_DURATION + 0.0001;
      var damping = 5 / timeScale;
      var cameraTargetZ = 3 * this.scaleFactor;
      var isMoving = this.control.isPointerDown || Math.abs(this.smoothRotationVelocity) > 0.01;

      if (isMoving !== this.movementActive) {
        this.movementActive = isMoving;
        this.onMovementChange(isMoving);
      }

      if (!this.control.isPointerDown) {
        var nearestVertexIndex = this.findNearestVertexIndex();
        var itemIndex = nearestVertexIndex % Math.max(1, this.items.length);
        this.onActiveItemChange(itemIndex);
        var snapDirection = vec3.normalize(vec3.create(), this.getVertexWorldPosition(nearestVertexIndex));
        this.control.snapTargetDirection = snapDirection;
      } else {
        cameraTargetZ += this.control.rotationVelocity * 80 + 2.5;
        damping = 7 / timeScale;
      }

      this.camera.position[2] += (cameraTargetZ - this.camera.position[2]) / damping;
      this.updateCameraMatrix();
    }

    findNearestVertexIndex() {
      var n = this.control.snapDirection;
      var inversOrientation = quat.conjugate(quat.create(), this.control.orientation);
      var nt = vec3.transformQuat(vec3.create(), n, inversOrientation);
      var maxD = -1;
      var nearestVertexIndex = 0;
      for (var i = 0; i < this.instancePositions.length; ++i) {
        var d = vec3.dot(nt, this.instancePositions[i]);
        if (d > maxD) { maxD = d; nearestVertexIndex = i; }
      }
      return nearestVertexIndex;
    }

    getVertexWorldPosition(index) {
      var nearestVertexPos = this.instancePositions[index];
      return vec3.transformQuat(vec3.create(), nearestVertexPos, this.control.orientation);
    }
  }

  /* ---- vanilla mount (replaces the React wrapper) ---------------------- */
  global.mountInfiniteMenu = function (container, items, scale) {
    if (!container || !items || !items.length) return null;
    var probe = document.createElement("canvas");
    if (!probe.getContext("webgl2")) return null; // needs WebGL2

    container.innerHTML =
      '<canvas id="infinite-grid-menu-canvas"></canvas>' +
      '<p class="face-title"></p>' +
      '<p class="face-description"></p>' +
      '<div class="view-expand" hidden>' +
      '<button class="view-expand__close" type="button" aria-label="Back to the sphere"></button>' +
      "</div>";

    var canvas = container.querySelector("#infinite-grid-menu-canvas");
    var titleEl = container.querySelector(".face-title");
    var descEl = container.querySelector(".face-description");
    var expandEl = container.querySelector(".view-expand");
    var closeBtn = container.querySelector(".view-expand__close");
    var expandImg = null;   // built on first open, never shipped without a src
    var activeIndex = -1;

    // The expanded view uses the original file, not the atlas texture, so it is
    // shown at full source resolution.
    function openExpanded() {
      var item = items[activeIndex % items.length];
      if (!item) return;
      if (!expandImg) {
        expandImg = document.createElement("img");
        expandImg.className = "view-expand__img";
        expandImg.decoding = "async";
        expandEl.insertBefore(expandImg, closeBtn);   // image above the ring
      }
      expandImg.src = item.image;
      expandImg.alt = item.title ? "PraxisOS " + item.title + " screen" : "";
      expandEl.hidden = false;
      requestAnimationFrame(function () { expandEl.classList.add("is-open"); });
      container.classList.add("is-expanded");
    }
    function closeExpanded() {
      expandEl.classList.remove("is-open");
      container.classList.remove("is-expanded");
      setTimeout(function () { if (!expandEl.classList.contains("is-open")) expandEl.hidden = true; }, 260);
    }
    closeBtn.addEventListener("click", closeExpanded);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !expandEl.hidden) closeExpanded();
    });

    // A press that neither moved nor lingered is a tap, not a drag.
    var downX = 0, downY = 0, downT = 0;
    canvas.addEventListener("pointerdown", function (e) {
      downX = e.clientX; downY = e.clientY; downT = Date.now();
    });
    canvas.addEventListener("pointerup", function (e) {
      var moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (moved < 6 && Date.now() - downT < 400) openExpanded();
    });

    function setMoving(isMoving) {
      var cls = isMoving ? "inactive" : "active";
      titleEl.className = "face-title " + cls;
      descEl.className = "face-description " + cls;
    }
    function setActive(index) {
      if (index === activeIndex) return;
      activeIndex = index;
      var item = items[index % items.length];
      titleEl.textContent = item.title || "";
      descEl.textContent = item.description || "";
    }

    var sketch;
    try {
      sketch = new InfiniteGridMenu(canvas, items, setActive, setMoving,
        function (sk) { sk.run(); }, scale === undefined ? 1.0 : scale);
    } catch (e) {
      container.innerHTML = "";
      return null;
    }
    setMoving(false);

    var resizeTO;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTO);
      resizeTO = setTimeout(function () { if (sketch) sketch.resize(); }, 120);
    });
    return sketch;
  };
})(window);
