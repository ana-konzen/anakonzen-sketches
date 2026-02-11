#ifdef GL_ES
precision highp float;
#endif

// Built-in transformation matrices.
uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;
uniform mat3 uNormalMatrix;


// Mesh attributes.
attribute vec3 aPosition;
attribute vec2 aTexCoord;

// Custom uniforms.
uniform vec2 uResolution;

uniform float uNoiseScale;
uniform float uOffsetScale;




// Passed attributes.
varying vec2 vTexCoord;
varying vec3 vNormal;

varying vec3 vViewPos;
varying vec3 vViewNormal;

//got noise functions from gpt

// tiny hash noise (fast + simple)
float hash(vec2 p){
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float smoothNoise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(a, b, u.x) +
         (c - a)*u.y*(1.0 - u.x) +
         (d - b)*u.x*u.y;
}

float fbm(vec2 p){
  float f = 0.0;
  float a = 0.5;
  for(int i=0;i<5;i++){
    f += a * smoothNoise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return f;
}

// height function in uv space, got this w/ trial and error + chatgpt
float heightAt(vec2 uv){
  float n = fbm(uv * uNoiseScale / 1.5);
  // n = (n - 0.5) * 2.0;
  n = clamp(n, 0.0, 1.0);
  n = pow(n, 1.4);
  float amp = uOffsetScale * 0.1;  

  return n * amp;
}

void main() 
{
  // Copy the vec3 position into a vec4.
  vec4 position = vec4(aPosition, 1.0);
  
  float h  = heightAt(aTexCoord);
  
  position.z += h;
  
   // approximate normal from height field gradient
  // float e = 0.002; // smaller = more detailed, too small can get noisy
  float e = 1.0 / (uNoiseScale * 300.0); 
  float hx = heightAt(aTexCoord + vec2(e, 0.0));
  float hy = heightAt(aTexCoord + vec2(0.0, e));
  
  vec3 dx = vec3(1.0, 0.0, (hx - h) / e);
  vec3 dy = vec3(0.0, 1.0, (hy - h) / e);
  
  vec3 nObj = normalize(cross(dx, dy));
  
  vec4 viewPos4 = uModelViewMatrix * position;
  vViewPos = viewPos4.xyz;
  vViewNormal = normalize(uNormalMatrix * nObj);

  
  gl_Position = uProjectionMatrix * viewPos4;


  // Pass data to the fragment shader.
  vTexCoord = aTexCoord;
}