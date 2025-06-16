//
// bloom-combine.frag - Шейдер фрагмента. Берёт текстуру оригинала и текстуру размытия и объединяет их.
//

#version 330 core

// Входные параметры:
uniform sampler2D u_orig_texture;   // Оригинальная текстура (до размытия).
uniform sampler2D u_bloom_texture;  // Текстура после размытия.
uniform float u_exposure;           // 1.0 - Нормально. Чем больше, тем ярче. Чем меньше (до 0) тем темнее.

// Координаты текстуры и выходной цвет:
in vec2 v_texcoord;
out vec4 FragColor;

// Основная функция:
void main() {
    // Получаем цвета с текстур:
    vec2 texcoord = vec2(v_texcoord.x, 1.0-v_texcoord.y);
    vec4 orig = texture(u_orig_texture, texcoord);
    vec4 bloom = texture(u_bloom_texture, texcoord);

    // Находим альфу и вычисляем итоговый цвет:
    float alpha = clamp(orig.a+max(max(bloom.r, bloom.g), bloom.b), 0.0, 1.0);
    vec3 resultColor = vec3(1.0) - exp(-(orig.rgb+bloom.rgb)*u_exposure);

    // Выходной цвет:
    FragColor = vec4(resultColor/max(alpha, 0.0001), alpha);
}
