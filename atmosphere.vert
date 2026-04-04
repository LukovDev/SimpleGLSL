//
// atmosphere.vert - Шейдер пост-процессинга для отображения планетарных атмосфер.
//
// Шейдер должен применяться на прямоугольнике.
//

#version 330 core

layout (location = 0) in vec3 a_position;

// Основная функция:
void main() {
    gl_Position = vec4(a_position, 1.0);
}
