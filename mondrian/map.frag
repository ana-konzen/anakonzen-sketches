#ifdef GL_ES
precision highp float;
#endif

/*
TODO:
occasional big color field
bleed edges slightly?
change z coord?

*/

/* random seed so that it's not the same every single render

(I didn't find a way to do this in GLSL ://// )

I pass it straight to the random function to make it ~extra~ random I guess lol!
*/
uniform float uSeed;

uniform float uLight;

uniform vec2 uMousePos;



// Passed attributes.
varying vec2 vTexCoord;
// varying vec3 vNormal;
varying vec3 vViewPos;
varying vec3 vViewNormal;


int NUM_RECTS = 5;

float MARGIN = 0.01;

struct BevelRect {
  float fill;
  float edge;
  float highlight;
  float shadow;
};

struct MondrianRect {
  vec2 pos;
  vec2 sz;
  vec3 c;
  float id;
  BevelRect rect;
};

float random(vec2 seed) {
  return fract(
    sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453123
  );
}

BevelRect rect(float x, float y, float w, float h, vec3 L) {
  
  float bevelW  = 0.04;
  
  float xEdge = (1.0 - w) / 2.0;
  float yEdge = (1.0 - h) / 2.0;
  
  float xPos = x - 0.5 + w / 2.0;
  
  float yPos = y - 0.5 + h / 2.0;
  
   // distances to each edge (positive = inside)
  float dL = vTexCoord.x - (xEdge + xPos);
  float dB = (1.0 - vTexCoord.y) - (yEdge - yPos);
  float dR = (1.0 - vTexCoord.x) - (xEdge - xPos);
  float dT = vTexCoord.y - (yEdge + yPos);
  
  float fill = step(0.0, dL)
             * step(0.0, dB)
             * step(0.0, dR)
             * step(0.0, dT);
  
   // edge band
  float minDist = min(min(dL, dR), min(dB, dT));
  float edge = (1.0 - smoothstep(0.0, bevelW, minDist)) * fill;
  
  // directional bevel (top/left lighter, bottom/right darker)
  float edgeL = (1.0 - smoothstep(0.0, bevelW, dL)) * fill;
  float edgeT = (1.0 - smoothstep(0.0, bevelW, dT)) * fill;
  float edgeR = (1.0 - smoothstep(0.0, bevelW, dR)) * fill;
  float edgeB = (1.0 - smoothstep(0.0, bevelW, dB)) * fill;
  
  vec2 L2 = normalize(vec2(L.x, L.y));  

  // outward normals for each edge in UV space
  float wL = max(dot(vec2(-1.0,  0.0), L2), 0.0);
  float wR = max(dot(vec2( 1.0,  0.0), L2), 0.0);
  float wB = max(dot(vec2( 0.0, -1.0), L2), 0.0);
  float wT = max(dot(vec2( 0.0,  1.0), L2), 0.0);

  // highlight = edges facing the light
  float hl = edgeL * wL + edgeR * wR + edgeB * wB + edgeT * wT;

  // shadow = edges facing away from the light
  float sL = max(dot(vec2(-1.0,  0.0), -L2), 0.0);
  float sR = max(dot(vec2( 1.0,  0.0), -L2), 0.0);
  float sB = max(dot(vec2( 0.0, -1.0), -L2), 0.0);
  float sT = max(dot(vec2( 0.0,  1.0), -L2), 0.0);

  float sh = edgeL * sL + edgeR * sR + edgeB * sB + edgeT * sT;

  // optional: normalize so bevel strength stays similar at different angles
  float norm = max(wL + wR + wB + wT, 0.0001);
  hl /= norm;
  sh /= norm;
  
  return BevelRect(
    fill,
    edge,
    hl,
    sh
  );
}

vec3 rgb(int r, int g, int b) {
  return vec3(float(r), float(g), float(b)) / 255.0;
}



vec3 pickColor(float id) {
  // vec3 white = rgb(247, 247, 242) - rgb(222, 214, 206) * mix(0.0, 0.2, random(vTexCoord));
  vec3 white = rgb(255, 250, 235);
  vec3 red = rgb(209, 54, 23);
  vec3 yellow = rgb(245, 210, 12);
  vec3 blue = rgb(8, 74, 166);
  
  float r = random(vec2(id, uSeed)); 
  if (r < 0.45) return white;
  if (r < 0.65) return red;
  if (r < 0.82) return yellow;
  return blue;
}

vec2 getRandomPos(float id) {
  vec2 seed = vec2(id, uSeed);
  float x = mix(0.005, 0.05, random(seed + 10.0));
  float y = mix(0.01, 0.01, random(seed + 20.0));
  
  return vec2(x, y);
}

vec2 getRandomSize(float id) {
  vec2 seed = vec2(id, uSeed);
  float w = mix(0.1, 0.5, random(seed + 30.0));
  float h = mix(0.1, 0.5, random(seed + 40.0));
  
  return vec2(w, h);
}

vec3 getSpec(vec3 N, vec3 H, float matMix, float edgeSpecBoost) {
  float shininess = mix(80.0, 220.0, matMix);      // matte -> glossy
  float specStrength = mix(0.02, 0.08, matMix);     // how bright

  float spec = pow(max(dot(N, H), 0.0), shininess) * specStrength;
  
  spec *= (1.0 + 1.5 * edgeSpecBoost); // tweak 0.5–2.5
  
  return vec3(spec);
}

void paintRect(
  float x, float y,
  vec2 size,
  vec3 col,
  vec3 L,
  inout vec3 albedo,
  inout float matMix,
  inout float edgeSpecBoost
){
  BevelRect r = rect(x, y, size.x, size.y, L);

  albedo = mix(albedo, col, r.fill);
  matMix = mix(matMix, 1.0, r.fill);

  // bevel shading
  float bevelAmt = 0.2;
  albedo += vec3(1.0) * (bevelAmt * r.highlight);
  albedo *= 1.0 - (bevelAmt * 0.6 * r.shadow);

  edgeSpecBoost = max(edgeSpecBoost, r.edge);
}

struct Rect {
  float x;
  float y;
  float w;
  float h;
  bool isHor;
  float id;
};



bool done = false;

void splitRects(
  Rect r0,   
  vec3 L,
  inout vec3 albedo,
  inout float matMix,
  inout float edgeSpecBoost
) {
  const float min_dimension = 0.1;
  const int maxId = 16;
  Rect rects[maxId];
  for (int i = 0; i < maxId; i++) {
    rects[i] = Rect(0.0, 0.0, 0.0, 0.0, false, 0.0);   
  }
  rects[1] = r0;
  
  for (int i = 1; i < maxId; i++) { 
    Rect rBase = rects[i];
    if (rBase.id == 0.0) continue;
    
    if ((rBase.w <= 2.0*min_dimension) || (rBase.h <= 2.0*min_dimension) || (2 * i + 1 >= maxId)) {
      vec3 randomColor = pickColor(float(i));
      paintRect(rBase.x + MARGIN, rBase.y + MARGIN, vec2(rBase.w - MARGIN, rBase.h - MARGIN), randomColor, L, albedo, matMix, edgeSpecBoost);
    } else {
      if (rBase.isHor) {
        float hSplit = mix(min_dimension, rBase.h - min_dimension, random(vec2(uSeed, rBase.id)));
        rects[2*i] = Rect(rBase.x, rBase.y, rBase.w, hSplit, !rBase.isHor, rBase.id * 2.0);
        rects[2*i+1] = Rect(rBase.x, rBase.y + hSplit, rBase.w, rBase.h - hSplit, !rBase.isHor, rBase.id * 2.0 + 1.0);
      } else {
        float wSplit = mix(min_dimension, rBase.w - min_dimension, random(vec2(uSeed, rBase.id)));
        rects[2*i] = Rect(rBase.x, rBase.y, wSplit, rBase.h, !rBase.isHor, rBase.id * 2.0);
        rects[2*i+1] = Rect(wSplit, rBase.y, rBase.w - wSplit, rBase.h, !rBase.isHor, rBase.id * 2.0 + 1.0);
      }
    }
  }
}


void main() 
{
  vec3 albedo = rgb(48, 41, 35);
  
  float matMix = 0.7;   
  
  vec3 L = normalize(vec3(uMousePos.x, uMousePos.y, 1.0));
  
  float edgeSpecBoost = 0.0; 
  
  
  splitRects(Rect(0.0, 0.0, 1.0 - MARGIN, 1.0 - MARGIN, true, 1.0), L, albedo, matMix, edgeSpecBoost);
  
   
  // lighting stuff
  vec3 N = normalize(vViewNormal);
  vec3 V = normalize(-vViewPos);

  float diff = max(dot(N, L), 0.0);

  float ambient = uLight / 1000.0;

  // Blinn-Phong spec
  vec3 H = normalize(L + V);
  float lambert = ambient + diff * 0.8;

  vec3 lit = albedo * lambert + getSpec(N, H, matMix, edgeSpecBoost);


  gl_FragColor = vec4(lit, 1.0);
}