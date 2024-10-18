//
// pixelization.vert - Шейдер вершин. Отвечает за настройку преобразований позиции вершин в шейдере.
//

#version 330 core

// Позиция вершины:
layout (location = 0) in vec3 a_position;

// Основная функция:
void main(void) {
    gl_Position = vec4(a_position, 1.0);
}
