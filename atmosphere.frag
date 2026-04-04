//
// atmosphere.frag - Шейдер пост-процессинга для отображения планетарных атмосфер.
//
// Шейдер должен применяться на прямоугольнике.
//

#version 330 core


// Входные параметры:
uniform vec2  u_resolution;  // Размер окна.
uniform vec3  u_camera_pos;  // Координаты камеры.
uniform vec3  u_camera_rot;  // Вращение камеры (pitch, yaw, roll).
uniform float u_camera_fov;  // Угол обзора камеры.

uniform vec3  u_planet_pos;  // Координаты атмосферы.
uniform float u_planet_rad;  // Радиус планеты (вокруг которой атмосфера).
uniform vec3  u_sun_dir;     // Направление солнца.

uniform float u_floor_rad;   // Радиус "пола" внутри атмосферы. Рекомендуется значения примерно как радиус планеты.
uniform float u_atm_height;  // Высота атмосферы (её толщина).
uniform float u_density_falloff;  // Коэффициент затухания плотности атмосферы. Рекомендуется значение 3.
uniform vec3  u_wavelenghts;      // Вектор волн света которые рассеиваются в атмосфере. Например: (720, 530, 440).
uniform float u_scattering_strength;  // Коэффициент корректирующий вектор волн света. По умолчанию равен 1.
uniform sampler2D u_blue_noise;  // Текстура белого шума, черно-белая, тайловая. По возможности старайтесь использовать.

// Чем больше = тем качественнее и медленнее. Подбирайте параметры пока артефакты не пропадут (обычно не менее 10):
uniform int u_num_in_scatter_points;     // Кол-во точек рассеивания.
uniform int u_num_optical_depth_points;  // Кол-во точек оптической глубины атмосферы. Очень сильно нагружает отрисовку.


// Итоговый цвет:
out vec4 FragColor;


// Константы:
const float MAX_FLOAT = 3.402823466e+38;
const float EPSILON = 0.000;


// Функция случайных чисел Interleaved Gradient Noise:
float rand(vec2 p) {
    return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}


// Матричный поворот по X:
mat3 rotate_x(float angle) {
    float rad_angle = radians(angle);
    float s = sin(rad_angle), c = cos(rad_angle);
    return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c);
}


// Матричный поворот по Y:
mat3 rotate_y(float angle) {
    float rad_angle = radians(angle);
    float s = sin(rad_angle), c = cos(rad_angle);
    return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
}


// Матричный поворот по Z:
mat3 rotate_z(float angle) {
    float rad_angle = radians(angle);
    float s = sin(rad_angle), c = cos(rad_angle);
    return mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0);
}


// Возвращает вектор (расстояние до сферы, расстояние внутри сферы):
// Если источник луча находится внутри сферы, расстояние до сферы = 0.
// Если луч не попадает в сферу, MAX_FLOAT и 0.
vec2 ray_sphere(vec3 center, float radius, vec3 ray_pos, vec3 ray_dir) {
    vec3 offset = ray_pos - center;
    float a = 1.0f;  // Установите dot(ray_dir, ray_dir) если ray_dir может быть не нормализованным.
    float b = 2.0f * dot(offset, ray_dir);
    float c = dot(offset, offset) - radius * radius;
    float d = b * b - 4 * a * c;  // Дискриминант из квадратичной формулы.

    // Количество пересечений: 0 при d < 0; 1 при d = 0; 2 при d > 0:
    if (d > 0) {
        float s = sqrt(d);
        float dst_near = max(0.0f, (-b - s) / (2 * a));
        float dst_far = (-b + s) / (2.0f * a);

        // Игнорировать пересечения, которые происходят за лучом:
        if (dst_far >= 0) {
            return vec2(dst_near, dst_far - dst_near);
        }
    }

    // Луч не пересекает сферу:
    return vec2(MAX_FLOAT, 0.0f);
}


// Расчет плотности в точке рассеивания:
float density_at_point(vec3 density_sample_point) {
    float height_above_surface = length(density_sample_point - u_planet_pos) - u_planet_rad;
    float height01 = height_above_surface / ((u_planet_rad + u_atm_height) - u_planet_rad);
    float local_density = exp(-height01 * u_density_falloff) * (1.0f - height01);
    return local_density;
}


// Расчет оптической глубины:
float optical_depth(vec3 ray_pos, vec3 ray_dir, float ray_len) {
    vec3 density_sample_point = ray_pos;
    float step_size = ray_len / (u_num_optical_depth_points - 1);
    float optical_depth = 0.0f;

    for (int i = 0; i < u_num_optical_depth_points; i++) {
        float local_density = density_at_point(density_sample_point);
        optical_depth += local_density * step_size;
        density_sample_point += ray_dir * step_size;
    }
    return optical_depth;
}


// Рассчитываем освещение атмосферы:
vec3 calc_light(vec3 ray_pos, vec3 ray_dir, float ray_len, vec3 scatt_coefs, vec3 orig_col) {
    vec3 in_scatter_point = ray_pos;
    float step_size = ray_len / (u_num_in_scatter_points - 1);
    vec3 in_scattered_light = vec3(0.0f);
    vec3 sun_dir = normalize(u_sun_dir);

    for (int i = 0; i < u_num_in_scatter_points; i++) {
        float sun_ray_len = ray_sphere(u_planet_pos, (u_planet_rad + u_atm_height), in_scatter_point, sun_dir).y;
        float sun_ray_optical_depth = optical_depth(in_scatter_point, sun_dir, sun_ray_len);
        float view_ray_optical_depth = optical_depth(in_scatter_point, -ray_dir, step_size * i);
        vec3 transmittance = exp(-(sun_ray_optical_depth + view_ray_optical_depth) * scatt_coefs);
        float local_density = density_at_point(in_scatter_point);

        in_scattered_light += local_density * transmittance * scatt_coefs * step_size;
        in_scatter_point += ray_dir * step_size;
    }

    float total_view_optical_depth = optical_depth(ray_pos, ray_dir, ray_len);
    float orig_col_transmittance = exp(-total_view_optical_depth);
    return orig_col * orig_col_transmittance + in_scattered_light;
}


// Получить коэффициенты рассеивания цветов:
vec3 scattering_coefficients(float red, float green, float blue) {
    float scatter_r = pow(400.0f / red, 4) * u_scattering_strength;
    float scatter_g = pow(400.0f / green, 4) * u_scattering_strength;
    float scatter_b = pow(400.0f / blue, 4) * u_scattering_strength;
    return vec3(scatter_r, scatter_g, scatter_b);
}


// Основная функция:
void main() {
    vec2 uv = (gl_FragCoord.xy / u_resolution.xy * 2.0f - 1.0f) * u_resolution / u_resolution.y;
    uv *= tan(radians(u_camera_fov) / 2.0f);  // Применяем угол обзора.

    // Создаём луч для каждого пикселя камеры:
    vec3 ray_pos = u_camera_pos;
    mat3 cam_rot = rotate_z(u_camera_rot.z) * rotate_y(u_camera_rot.y) * rotate_x(u_camera_rot.x);
    vec3 ray_dir = normalize(cam_rot * vec3(uv, -1.0));

    // Проверяем пересечения луча со сферами:
    vec2 atm_hit   = ray_sphere(u_planet_pos, (u_planet_rad + u_atm_height), ray_pos, ray_dir);
    vec2 floor_hit = ray_sphere(u_planet_pos, u_floor_rad, ray_pos, ray_dir);

    // Расстояние до атмосферы и внутри неё:
    float dst_to_atm = atm_hit.x;
    float dst_in_atm = atm_hit.y;

    // TODO: Тут надо получить цвет пикселя из отрисованного готового кадра, чтобы поверх рисовать атмосферу:
    vec4 orig_col = vec4(0, 0, 0, 1);

    // TODO: Тут надо получить глубину сцены в реальных метрах от камеры:
    float scene_depth = 40000.0;  // Временно.

    // Отсекаем пространство внутри атмосферы:
    float dst_floor = min(scene_depth, floor_hit.x);

    // Сколько реально проходим в атмосфере:
    float dst_through = max(0.0, min(dst_in_atm, dst_floor - dst_to_atm));

    // Коэффициенты рассеивания цветов:
    vec3 scatt_coefs = scattering_coefficients(u_wavelenghts.x, u_wavelenghts.y, u_wavelenghts.z);

    // Попали ли в атмосферу:
    if (dst_through > 0) {
        vec3 point_in_atm = ray_pos + ray_dir * (dst_to_atm + EPSILON);
        vec3 light = calc_light(point_in_atm, ray_dir, dst_through - EPSILON*2.0f, scatt_coefs, orig_col.rgb);

        // Смешиваем с шумом чтобы избавиться от квантования (ступенек градиента):
        light += (texture(u_blue_noise, gl_FragCoord.xy / 128.0).r - 0.5) / 255.0;  // Используем текстуру если можно.
        light += (rand(gl_FragCoord.xy) - 0.5) / 255.0;  // Иначе/также пытаемся сгладить псевдо-функцией шума.

        FragColor = vec4(light.rgb, 1.0);
    } else {
        FragColor = vec4(0, 0, 0, 0);  // TODO: FragColor = orig_col;
    }
}
