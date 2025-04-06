//
// shader.vert - Шейдер вершин. Отвечает за настройку преобразований позиции вершин в шейдере.
//

#version 330 core

// Входные параметры (матрицы преобразования):
uniform mat4 u_model = mat4(1.0);
uniform mat4 u_view = mat4(1.0);
uniform mat4 u_projection = mat4(1.0);

// Входящие атрибуты:
layout (location = 0) in vec3 a_position;
layout (location = 1) in vec2 a_texcoord;

// Координаты текстуры:
out vec2 v_texcoord;

// Основная функция:
void main(void) {
    gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
    v_texcoord = a_texcoord;
}
