//
// pixelization.frag - Шейдер фрагмента. Берёт текстуру кадра и пикселизирует её на прямоугольнике во всё окно.
//

#version 330 core

// Входные параметры:
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_pixel_size;
uniform bool u_use_smooth;

// Выходной цвет:
out vec4 FragColor;

// Основная функция:
void main() {
    // Вычисляем текстурные координаты:
    vec2 TexCoords = gl_FragCoord.xy / u_resolution;
    vec4 color;  // Итоговый цвет.

    // Вычисляем координаты "большого" пикселя:
    vec2 pixelated_coords = floor(TexCoords * u_resolution / u_pixel_size) * u_pixel_size / u_resolution;

    // Проверка на режим "сглаживания" (интерполяции) пикселей:
    if (u_use_smooth) { // Используем texture для выборки с интерполяцией:
        color = texture(u_texture, pixelated_coords);
    } else { // Используем texelFetch для точной выборки без интерполяции:
        color = texelFetch(u_texture, ivec2(pixelated_coords * textureSize(u_texture, 0)), 0);
    }

    FragColor = color;
}
