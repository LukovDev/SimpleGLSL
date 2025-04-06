//
// bloom.frag - Шейдер фрагмента. Берёт текстуру кадра и делает свечение на ней по одной оси.
//

#version 330 core

// Входные параметры:
uniform sampler2D u_texture;  // Это текстура которую надо размыть.
uniform int u_axis;           // 0 - Блум по горизонтали, 1 - Блум по вертикали.
uniform int u_radius;         // Радиус должен находиться от 0 до 128 (чем больше, тем выше нагрузка на GPU).

// Координаты текстуры и выходной цвет:
in vec2 v_texcoord;
out vec4 FragColor;

// Основная функция:
void main(void) {
    vec2 tex_offset = 1.0 / textureSize(u_texture, 0);
    vec4 sum = texture(u_texture, v_texcoord);  // Текущий пиксель по текущей координате текстуры.
    vec2 dir = (u_axis == 0) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);  // Направление размытия.

    // Делаем размытие от 1 до u_radius по определённой оси:
    for (int i = 1; i <= u_radius; i++) {
        vec2 offset = dir * tex_offset * float(i);
        sum += texture(u_texture, v_texcoord + offset);
        sum += texture(u_texture, v_texcoord - offset);
    }

    // Среднее арифметическое от всех взятых сэмплов (получаем эффект box-blur):
    FragColor = sum / float(u_radius * 2 + 1);
}
