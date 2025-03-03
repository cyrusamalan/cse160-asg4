// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = a_Normal;
    v_VertPos = u_ModelMatrix * a_Position;
    }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform int u_whichTexture;
  uniform vec3 u_lightPos;
  uniform vec3 u_cameraPos;
  varying vec4 v_VertPos;
  uniform int u_lightingOn;


  void main() {
    if (u_whichTexture == -3) {
      gl_FragColor = vec4(0.0, 0.0, 0.5, 1.0);  // Dark blue (R=0, G=0, B=0.5)
    } else if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;
    } else if (u_whichTexture == -1) {
      gl_FragColor =  vec4(v_UV, 1.0, 1.0);
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else {
      gl_FragColor = vec4(1,.2,.2,1); 
    }

    vec3 lightVector = u_lightPos-vec3(v_VertPos);
    float r=length(lightVector);
    
    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    float nDotL = max(dot(N,L),0.0);

    // reflection
    vec3 R = reflect(-L,N);

    // eye
    vec3 E = normalize(u_cameraPos - vec3(v_VertPos));

    vec3 diffuse = vec3(gl_FragColor) * nDotL;
    vec3 ambient = vec3(gl_FragColor)*0.3;
    float specular = pow(max(dot(E,R),0.0),2.0);
       if (u_lightingOn == 1) {
    vec3 diffuse = vec3(gl_FragColor) * nDotL;
    vec3 ambient = vec3(gl_FragColor) * 0.3;
    float specular = pow(max(dot(E, R), 0.0), 2.0);
    gl_FragColor = vec4(specular + diffuse + ambient, 1.0);
    } else {
        gl_FragColor = gl_FragColor; // No lighting applied
    }

  }`;

// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_whichTexture;
let g_sunAnimationOn = true; // Controls the sun movement
let g_lightingOn = true;
let u_lightingOn;  // Declare as a global variable




let g_globalAngleX = 0;
let g_globalAngleY = 0;
let g_camera = false;
let g_normalOn = false;
let g_startTime = performance.now() / 1000.0;
let g_seconds = 0;
let g_lightPos = [5, 1.8, .2];


let g_eye = new Vector3([0, 2, 4]);
let g_at = new Vector3([5, 0, -1]);
let g_up = new Vector3([0, 1, 0]);



function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  // gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", { preserveDrawingMainBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  // enables blending for opacity
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

function connectVariablesToGLSL() {

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  u_lightingOn = gl.getUniformLocation(gl.program, 'u_lightingOn');
  if (!u_lightingOn) {
      console.log('Failed to get the storage location of u_lightingOn');
      return;
  }
  gl.uniform1i(u_lightingOn, g_lightingOn ? 1 : 0);


  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
  if (!u_lightPos) {
    console.log('Failed to get the storage location of u_lightPos');
    return;
  }

  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
  if (!u_lightPos) {
    console.log('Failed to get the storage location of u_cameraPos');
    return;
  }
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
  }
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
  }
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
  }
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
  }
  // Get the storage location of u_Sampler
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return false;
  }
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }
  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler2');
    return false;
  }
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return false;
  }
  var modelMatrix = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

}

function convertMouseCoordinatesToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
  return ([x, y]);
}

function renderScene() {
  // Check the time at the start of this fuction
  var startTime = performance.now();

  var projMatrix = new Matrix4();
  projMatrix.setPerspective(50, 1 * canvas.width / canvas.height, 1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMatrix.elements);

  var viewMatrix = new Matrix4();
  viewMatrix.setLookAt(g_eye.elements[0], g_eye.elements[1], g_eye.elements[2], g_at.elements[0], g_at.elements[1], g_at.elements[2], g_up.elements[0], g_up.elements[1], g_up.elements[2]);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  var globalRotMat = new Matrix4().rotate(g_globalAngleX, 0, 1, 0).rotate(g_globalAngleY, 1, 0, 0);

  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);



  var cuber = new Cube();
  cuber.color = [1.0, 0.2, 0.2, 1.0]; // Red cube
  cuber.textureNum = -2;  // Disable textures to use color
  cuber.matrix.translate(7, 1, 0);
  cuber.matrix.scale(1.2, 1.2, 1.2);


  var spherer = new Sphere();
  spherer.matrix.translate(8, -.5, 0);
  spherer.textureNum = 0;
  spherer.render();

  gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  gl.uniform3f(u_cameraPos, g_eye[0], g_eye[1], g_eye[2]);
  var light = new Cube();
  light.color = [1, 2, 0, 1];
  light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  light.matrix.scale(-.3, -.3, -.3);
  light.matrix.translate(-.5, -.5, -.5);
  light.renderFastUVNormal();
  //drawFloor();
  drawSky();

  //drawMap();
  var duration = performance.now() - startTime;
  sendTextToHTML("ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration) / 10, "fps");
}

function initTextures() {
  var image0 = new Image();
  var image1 = new Image();
  var image2 = new Image();
  if (!image0 || !image1) {
    console.log('Failed to create the image objects');
    return false;
  }
  // Register the event handler to be called on loading an image0
  image0.onload = function () { sendImageToTEXTURE0(image0, 0, u_Sampler0); };
  // Tell the browser to load an image0
  image0.src = '../images/globe.jpg';

  image1.onload = function () { sendImageToTEXTURE0(image1, 1, u_Sampler1); };
  image2.onload = function () { sendImageToTEXTURE0(image2, 2, u_Sampler2); };
  image2.src = '../images/sky1.jpg';
  return true;
}

function sendImageToTEXTURE0(image, textureUnit, sampler) {
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image0's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0 + textureUnit);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image0
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // Set the texture unit 0 to the sampler
  gl.uniform1i(sampler, textureUnit);
  console.log('finished loadTexture');
}

function keydown(ev) {
  var vecD = new Vector3();
  vecD.set(g_at);
  vecD.sub(g_eye);

  if (ev.key === "w" || ev.key === "W") { // Move forward
    vecD.normalize();
    g_eye.add(vecD);
    g_at.add(vecD);
  }
  else if (ev.key === "s" || ev.key === "S") { // Move backward
    vecD.normalize();
    g_eye.sub(vecD);
    g_at.sub(vecD);
  }
  else if (ev.key === "a" || ev.key === "A") { // Move left
    vecD.normalize();
    var left = Vector3.cross(vecD, g_up);
    left.normalize();
    left.mul(-1);
    g_eye.add(left);
    g_at.add(left);
  }
  else if (ev.key === "d" || ev.key === "D") { // Move right
    vecD.normalize();
    var right = Vector3.cross(vecD, g_up);
    right.normalize();
    g_eye.add(right);
    g_at.add(right);
  }
  else if (ev.key === "q" || ev.key === "Q") { // Rotate left
    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(15, g_up.elements[0], g_up.elements[1], g_up.elements[2]);
    let newVecD = rotationMatrix.multiplyVector3(vecD);
    var temp_eye = new Vector3();
    temp_eye.set(g_eye);
    temp_eye.add(newVecD);
    g_at.set(temp_eye);
  }
  else if (ev.key === "e" || ev.key === "E") { // Rotate right
    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(-5, g_up.elements[0], g_up.elements[1], g_up.elements[2]);
    let newVecD = rotationMatrix.multiplyVector3(vecD);
    var temp_eye = new Vector3();
    temp_eye.set(g_eye);
    temp_eye.add(newVecD);
    g_at.set(temp_eye);
  }
  else if (ev.key === "ArrowUp") { // Move UP
    g_eye.elements[1] += 0.2;
    g_at.elements[1] += 0.2;
  }
  else if (ev.key === "ArrowDown") { // Move DOWN
    g_eye.elements[1] -= 0.2;
    g_at.elements[1] -= 0.2;
  }

}
function tick() {
  g_seconds = (performance.now() / 1000.0) - g_startTime;
  renderScene();
  //g_lightPos[2] = 2*Math.cos(g_seconds);
  if (g_sunAnimationOn) {
    g_lightPos[1] = 0.8 + 2 * Math.sin(g_seconds * 0.5); // Slower movement
}



  requestAnimationFrame(tick);
}
function main() {

  setupWebGL();
  connectVariablesToGLSL();

  addActionsForHtmlUI();
  document.onkeydown = keydown;
  canvas.addEventListener('mousemove', (ev) => {

    // Normalize coordinates (-1 to 1 range)
    if (g_camera) {
      const xRatio = (ev.clientX / canvas.width) * 2 - 1;
      const yRatio = (ev.clientY / canvas.height) * 2 - 1;

      g_globalAngleX = xRatio * 60;
      g_globalAngleY = yRatio * 60;

      renderScene();
    }
  });
  initTextures();
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  renderScene();
  requestAnimationFrame(tick);
  //drawCny();
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
      console.log("Failed to get " + htmlID);
      return;
  }
  htmlElm.innerHTML = text;
}

function addActionsForHtmlUI() {
  document.getElementById('normalOn').onclick = function () { g_normalOn = true; };
  document.getElementById('normalOff').onclick = function () { g_normalOn = false; };
  document.getElementById('lightSlideX').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) {g_lightPos[0] = this.value/100; renderScene();}});
  document.getElementById('lightSlideY').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) {g_lightPos[1] = this.value/100; renderScene();}});
  document.getElementById('lightSlideZ').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) {g_lightPos[2] = this.value/100; renderScene();}});

  document.getElementById('toggleSun').onclick = function () {
    g_sunAnimationOn = !g_sunAnimationOn; // Toggle the animation
};

document.getElementById('toggleLighting').onclick = function () {
  g_lightingOn = !g_lightingOn;  // Toggle the lighting flag
  gl.uniform1i(u_lightingOn, g_lightingOn ? 1 : 0);  // Pass the new value to the shader
  renderScene();
};




}