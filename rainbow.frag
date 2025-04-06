//
// rainbow.frag - Шейдер фрагмента. На поверхности создаёт красивый переливающийся градиентный узор.
//

#version 330 core

// Входные параметры:
uniform float u_time;
uniform vec2 u_resolution;

// Координаты текстуры и выходной цвет:
out vec4 FragColor;

// Основная функция:
void main(void) {
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;
    FragColor = vec4(0.5 + 0.5 * cos(u_time + uv.xyx + vec3(0, 2, 4)), 1.0);
}
