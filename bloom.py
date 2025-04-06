#
# bloom.py - Это файл для примера работы со свечением и его комбинированием.
#


# В функции старт:
def start(self) -> None:
    # ...

    # Основной шейдер свечения (размытия):
    self.bloom_shd = ShaderProgram(
        vert=files.load_file("data/shaders/bloom.frag"),
        frag=files.load_file("data/shaders/bloom.frag")
    ).compile()

    # Шейдер комбинирования основной текстуры со свечением:
    self.bloom_combine = ShaderProgram(
        vert=files.load_file("data/shaders/bloom-combine.frag"),
        frag=files.load_file("data/shaders/bloom-combine.frag")
    ).compile()

    # Буферы FBO (render canvas) для поэтапного размытия:
    self.fbo_pingpong = [
        RenderCanvas(self.camera),
        RenderCanvas(self.camera)
    ]

    # Допустим что это наш слой на котором будет рисоваться всё то что должно светиться:
    self.orig_layer = RenderCanvas(self.camera)

    # ...


# Рисуем блум:
def render_bloom(self, render_canvas: RenderCanvas, radius: int = 8, iters: int = 2) -> None:
    # Очищаем буферы:
    for f in self.fbo_pingpong: f.clear()

    # Рисуем то что надо размыть:
    self.fbo_pingpong[1].begin()
    render_canvas.render()
    self.fbo_pingpong[1].end()

    # Применяем свечение (одна итерация = размытие по одной оси):
    # * FBO-Ping-Pong работает так, что мы используем текстуру другого фреймбуфера
    # | пока работаем с текущем, а потом меняем их местами и делаем тоже самое.
    axis = 0
    self.bloom_shd.begin()
    for _ in range(iters*2):
        self.fbo_pingpong[axis].begin()
        self.bloom_shd.set_uniform("u_axis", axis)
        self.bloom_shd.set_uniform("u_radius", radius)
        self.bloom_shd.set_sampler("u_texture", TextureUnits.rebind(self.fbo_pingpong[int(not axis)].texture, 0))
        self.fbo_pingpong[int(not axis)].render(custom_shader=True)
        self.fbo_pingpong[axis].end()
        axis = 0 if axis else 1
    self.bloom_shd.end()

    # Объединяем блум с оригиналом и сразу выводим результат:
    self.bloom_combine.begin()
    self.bloom_combine.set_sampler("u_orig_texture", TextureUnits.rebind(render_canvas.texture, 0))
    self.bloom_combine.set_sampler("u_bloom_texture", TextureUnits.rebind(self.fbo_pingpong[int(not axis)].texture, 1))
    self.bloom_combine.set_uniform("u_exposure", float(self.ui_val["exposure"]))
    render_canvas.render(custom_shader=True)
    self.bloom_combine.end()


# ПРИМЕР ИСПОЛЬЗОВАНИЯ:


# В функции отрисовки:
def render(self, delta_time: float) -> None:
    # ...

    # Очищаем холст (главное его очистить с нулевой альфой!):
    self.orig_layer.clear([0, 0, 0, 0])
    self.orig_layer.begin()  # Начали рисовать в холсте.
    # Рисуем обычный спрайт, можно и что нибудь другое:
    self.sprite.render(x=0, y=0, width=128, height=128)
    self.orig_layer.end()  # Закончили рисовать в холсте.

    # Рисуем свечение:
    # * Передаём в вызов холст который должен быть размыт,
    # | а также радиус размытия (от 0 до 128) и количество итераций
    # | размытия (чтобы убрать артефакты и повысить качество. Обычно
    # | достаточно от 1 до 2. Иногда можно поставить и 3-4, но не больше,
    # | иначе будет сильно падать FPS и вырастать нагрузка на GPU).
    self.render_bloom(self.orig_layer, 32, 2)

    # ...
