//
// low-color.frag - Шейдер фрагмента. Берёт текстуру кадра и ограничивает цветовой диапазон.
//

#version 330 core

// Входные параметры:
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_color_level;
uniform float u_time;

// Выходной цвет:
out vec4 FragColor;

// Основная функция:
void main() {
    // Вычисляем текстурные координаты:
    vec2 TexCoords = gl_FragCoord.xy / u_resolution;

    // Цвет пикселя:
    vec4 color = texture(u_texture, TexCoords);

    // Ограничиваем уровень цвета:
    FragColor = floor(color * (u_color_level*255.0)) / (u_color_level*255.0);
}
