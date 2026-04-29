/**
 * EightBitFilter — color quantization + saturation boost post-process filter.
 *
 * Snaps every RGB channel to `steps` discrete levels (default 6 → 216 colours)
 * and optionally boosts saturation for the vivid palette of classic consoles.
 *
 * Compatible with both WebGL (GlProgram) and WebGPU (GpuProgram) renderers.
 */
import { Filter, GlProgram, GpuProgram } from 'pixi.js';

// ── WebGL2 (GLSL) ────────────────────────────────────────────────────────────

const VERT_GLSL = `
in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition() {
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
}
vec2 filterTextureCoord() {
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}
void main() {
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`;

const FRAG_GLSL = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uSteps;
uniform float uSaturation;

void main() {
    vec4 c = texture(uTexture, vTextureCoord);
    if (c.a > 0.0) {
        c.rgb /= c.a;
        // Saturation boost — makes the palette feel more vivid/punchy
        float luma = dot(c.rgb, vec3(0.2125, 0.7154, 0.0721));
        c.rgb = mix(vec3(luma), c.rgb, uSaturation);
        // Snap each channel to uSteps discrete levels
        float s = uSteps - 1.0;
        c.rgb = floor(c.rgb * s + 0.5) / s;
        c.rgb = clamp(c.rgb, 0.0, 1.0);
        c.rgb *= c.a;
    }
    finalColor = c;
}
`;

// ── WebGPU (WGSL) ─────────────────────────────────────────────────────────────

const VERT_WGSL = `
struct GlobalFilterUniforms {
  uInputSize:    vec4<f32>,
  uInputPixel:   vec4<f32>,
  uInputClamp:   vec4<f32>,
  uOutputFrame:  vec4<f32>,
  uGlobalFrame:  vec4<f32>,
  uOutputTexture:vec4<f32>,
};
@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;

struct VSOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

fn filterVertexPosition(aPosition: vec2<f32>) -> vec4<f32> {
  var pos = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;
  pos.x = pos.x * (2.0 / gfu.uOutputTexture.x) - 1.0;
  pos.y = pos.y * (2.0 * gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;
  return vec4<f32>(pos, 0.0, 1.0);
}
fn filterTextureCoord(aPosition: vec2<f32>) -> vec2<f32> {
  return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);
}

@vertex
fn mainVertex(@location(0) aPosition: vec2<f32>) -> VSOutput {
  return VSOutput(filterVertexPosition(aPosition), filterTextureCoord(aPosition));
}
`;

const FRAG_WGSL = `
struct EightBitUniforms {
  uSteps:      f32,
  uSaturation: f32,
};

@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler: sampler;
@group(1) @binding(0) var<uniform> eightBitUniforms: EightBitUniforms;

@fragment
fn mainFragment(
  @location(0) uv: vec2<f32>,
  @builtin(position) position: vec4<f32>,
) -> @location(0) vec4<f32> {
  var c = textureSample(uTexture, uSampler, uv);
  if (c.a > 0.0) {
    var rgb = c.rgb / c.a;
    let luma = dot(rgb, vec3<f32>(0.2125, 0.7154, 0.0721));
    rgb = mix(vec3<f32>(luma), rgb, eightBitUniforms.uSaturation);
    let s = eightBitUniforms.uSteps - 1.0;
    rgb = floor(rgb * s + 0.5) / s;
    rgb = clamp(rgb, vec3<f32>(0.0), vec3<f32>(1.0));
    c = vec4<f32>(rgb * c.a, c.a);
  }
  return c;
}
`;

// ─────────────────────────────────────────────────────────────────────────────

export class EightBitFilter extends Filter {
  constructor(steps = 6, saturation = 1.3) {
    const glProgram = GlProgram.from({
      vertex: VERT_GLSL,
      fragment: FRAG_GLSL,
      name: 'eight-bit-filter',
    });
    const gpuProgram = GpuProgram.from({
      vertex: { source: VERT_WGSL, entryPoint: 'mainVertex' },
      fragment: { source: FRAG_WGSL, entryPoint: 'mainFragment' },
    });
    super({
      glProgram,
      gpuProgram,
      resources: {
        eightBitUniforms: {
          uSteps:      { value: steps,      type: 'f32' },
          uSaturation: { value: saturation, type: 'f32' },
        },
      },
    });
  }
}
