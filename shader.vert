//
// shader.vert - Шейдер вершин. Отвечает за настройку преобразований позиции вершин в шейдере.
//

#version 330 core

// Входные переменные:
uniform mat4 u_modelview;   // Матрица модель-вида.
uniform mat4 u_projection;  // Матрица проекции.

// Позиция вершины:
layout (location = 0) in vec3 a_position;

// Основная функция:
void main(void) {
    gl_Position = u_projection * u_modelview * vec4(a_position, 1.0);
}
