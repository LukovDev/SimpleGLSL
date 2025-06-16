//
// shader.frag - Шейдер фрагмента. Рисует пиксели.
//

#version 330 core

// Входные параметры:
uniform vec3 u_color;  // Цвет.

// Координаты текстуры и выходной цвет:
in vec2 v_texcoord;
out vec4 FragColor;

// Основная функция:
void main() {
    // Просто закрашиваем одним цветом:
    FragColor = vec4(u_color, 1);
}
