//
// shader.frag - Шейдер отрисовщик. Основной графический шейдер. Рисует пиксели.
//

#version 330 core

// Входные переменные:
uniform vec3 u_color;  // Цвет.

// Выходной цвет:
out vec4 FragColor;

// Основная функция:
void main(void) {
    // Просто закрашиваем одним цветом:
    FragColor = vec4(u_color, 1);
}
