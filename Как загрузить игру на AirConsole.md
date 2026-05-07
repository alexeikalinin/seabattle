# Как загрузить игру на AirConsole — полная инструкция

> Актуально для: AirConsole Developer Portal (2025)
> Проект: **Battleship Duel**

---

## Нужен ли Vercel?

**Нет, Vercel не нужен для AirConsole.**

AirConsole сам хостит твою игру бесплатно — ты просто загружаешь ZIP-архив через Developer Portal, и они размещают его на своих серверах.

| Сценарий | Нужен Vercel? |
|---------|--------------|
| Публикация игры на AirConsole | ❌ Нет — AirConsole хостит сам |
| Тест с реальным телефоном локально | ❌ Нет — достаточно ngrok (бесплатно) |
| Поделиться черновиком с тестировщиком без загрузки на AirConsole | ✅ Можно использовать Vercel |

> **Итог:** загружай ZIP на AirConsole Developer Portal — это всё что нужно.

---

## Где взять Game ID?

Game ID ты **придумываешь сам** — это просто уникальный строковый идентификатор в формате Java-пакета (reverse domain). Реальный домен иметь не нужно.

### Формат:
```
com.ИМЯ.НАЗВАНИЕИГРЫ
```

### Готовый Game ID для Battleship Duel:
```
com.alexeikalinin.battleshipduel
```

### Правила:
- только строчные буквы, цифры, точки
- никаких пробелов и спецсимволов
- должен быть уникальным в системе AirConsole (если занят — добавь год или цифру)
- после создания изменить нельзя

### Альтернативы если занят:
```
com.alexeikalinin.battleshipduel2025
io.github.alexeikalinin.battleshipduel
com.vibecoding.battleshipduel
```

---

## Готовые материалы для загрузки

Файлы созданы в папке `assets/`:

| Файл | Для чего | Размер |
|------|---------|--------|
| `assets/cover-art.svg` | Обложка игры | 512×512 |
| `assets/screenshot.svg` | Скриншот для магазина | 1280×720 |
| `assets/export-to-png.html` | Конвертер SVG → PNG | — |

### Как получить PNG из SVG (нужен PNG для AirConsole):

1. Открой файл `assets/export-to-png.html` в браузере
2. Нажми кнопку **"Скачать cover-art.png"** — скачается файл 512×512
3. Нажми кнопку **"Скачать screenshot.png"** — скачается файл 1280×720
4. Загружай эти PNG в форму на AirConsole Developer Portal

---

## Готовое описание для Store Description

Скопируй в поле **Store Description** (макс. 180 символов):

```
Classic Battleship for 2 players. Use your phones as controllers — place your fleet and sink the enemy! Couch multiplayer at its finest.
```

(137 символов — в пределах лимита)

---

## Стоимость — платить ничего не нужно

AirConsole **бесплатен для разработчиков**:
- Регистрация аккаунта — бесплатно
- Хостинг игры на серверах AirConsole — бесплатно
- Публикация в магазине AirConsole — бесплатно
- Тестирование через симулятор — бесплатно

Платная подписка **AirConsole Hero** существует только для *игроков* (не разработчиков) — это опциональная подписка, которая даёт доступ к премиум-играм. Твоя игра может входить в Hero-каталог или нет — на это не влияет публикация.

---

## Этап 1 — Подготовка проекта

### 1.1 Собрать финальный билд

В папке проекта выполни:

```bash
npm run build
```

Это создаст папку `dist/` с готовыми файлами. Убедись, что в `dist/` есть:

```
dist/
├── screen.html       ← главный экран (TV/браузер)
├── controller.html   ← контроллер (смартфон)
├── assets/           ← все ресурсы (JS, CSS, изображения, звуки)
└── ...
```

> **Важно:** оба файла `screen.html` и `controller.html` обязательны. AirConsole ищет именно эти имена.

### 1.2 Упаковать в ZIP

Запакуй **содержимое** папки `dist/` в ZIP-архив (не саму папку, а файлы внутри неё):

```bash
cd dist
zip -r ../battleship-duel.zip .
```

Структура внутри ZIP должна быть такой (файлы в корне архива):

```
battleship-duel.zip
├── screen.html
├── controller.html
└── assets/
    └── ...
```

---

## Этап 2 — Регистрация на AirConsole Developer Portal

1. Открой [https://www.airconsole.com/developers](https://www.airconsole.com/developers)
2. Войди через Google или создай аккаунт
3. После входа ты попадёшь в **Developer Dashboard**

---

## Этап 3 — Создание игры в портале

Нажми **"+ Create new game"** в левом сайдбаре. Откроется форма (как на скриншоте выше).

### Заполни поля:

| Поле | Что писать | Пример |
|------|-----------|--------|
| **Game ID** | Уникальный ID в Java-стиле (reverse domain) | `com.alexeikalinin.battleshipduel` |
| **Game name** | Название игры (макс. 40 символов) | `Battleship Duel` |
| **Author** | Твоё имя или название компании (макс. 100 символов) | `Alexei Kalinin` |
| **Author website** | Ссылка на твой сайт (опционально) | можно оставить пустым |
| **Store Description** | Описание для магазина (макс. 180 символов) | `Classic Battleship for 2 players. Use your phones as controllers. Sink your opponent's fleet!` |
| **Category** | Выбери жанр | `Strategy Games` или `Party Games` |
| **#Players** | Количество игроков | от `2` до `2` |

### Загрузи медиафайлы:

| Файл | Требования |
|------|-----------|
| **Cover Art** | PNG или JPEG, квадратное, минимум **512×512** пикселей, до 1 МБ |
| **Screenshot** | PNG или JPEG, соотношение 16:9, минимум **1280×720** пикселей, до 5 МБ |

> Если у тебя пока нет этих файлов — сделай скриншот игры и создай простую обложку в Canva или любом редакторе.

### Нажми **"Create Game"**

После создания игра получит статус **Draft** (черновик).

---

## Этап 4 — Загрузка файлов игры

После создания черновика на той же странице появится раздел загрузки файлов.

1. Найди поле для загрузки ZIP-архива
2. Загрузи `battleship-duel.zip` (подготовленный на Этапе 1)
3. Нажми **"Update Draft"**

AirConsole распакует архив и разместит файлы на своих серверах.

> После загрузки у игры будет URL вида:
> `https://www.airconsole.com/[game-id]/screen.html`

---

## Этап 5 — Тестирование через симулятор

Перед публикацией обязательно протести через симулятор.

### Онлайн-симулятор (без телефонов)

После загрузки файлов открой URL симулятора:

```
https://www.airconsole.com/[game-id]/screen.html/simulator
```

Симулятор покажет:
- экран игры слева
- два виртуальных контроллера справа
- все сообщения между устройствами в консоли

### Тест с реальными телефонами

1. Открой экран игры в браузере (из Developer Portal → кнопка Preview)
2. На экране появится код (например: `1234`)
3. На телефоне открой [www.airconsole.com](https://www.airconsole.com)
4. Введи код
5. Откроется `controller.html` на телефоне

---

## Этап 6 — Локальная разработка и тест до загрузки

Перед загрузкой на AirConsole можно тестировать локально.

### Запуск локального сервера

```bash
npm run dev
```

Vite запустит сервер, например на `http://localhost:5173`

### Подключение к AirConsole симулятору локально

Открой в браузере:

```
https://www.airconsole.com/#http://localhost:5173/screen.html
```

Добавь `/simulator` для режима симулятора:

```
https://www.airconsole.com/#http://localhost:5173/screen.html/simulator
```

### Тест с телефоном по локальной сети

Телефон и компьютер должны быть в **одной Wi-Fi сети**.

1. Узнай локальный IP компьютера:
   ```bash
   ipconfig getifaddr en0
   # например: 192.168.1.105
   ```
2. Открой в браузере компьютера:
   ```
   https://www.airconsole.com/#http://192.168.1.105:5173/screen.html
   ```
3. На телефоне открой [www.airconsole.com](https://www.airconsole.com) и введи код

> **Проблема с HTTPS/HTTP:** AirConsole работает по HTTPS, а локальный сервер — по HTTP. Если возникают ошибки смешанного контента, используй **ngrok**:
> ```bash
> ngrok http 5173
> # ngrok даст HTTPS URL, например: https://xxxx.ngrok.io
> # Открой: https://www.airconsole.com/#https://xxxx.ngrok.io/screen.html
> ```

---

## Этап 7 — Публикация игры

После того как игра протестирована и всё работает:

1. Зайди в [Developer Portal](https://www.airconsole.com/developers)
2. Выбери свою игру
3. Нажми **"Submit for Review"** (или аналогичную кнопку публикации)
4. Команда AirConsole проверит игру
5. После одобрения игра появится в магазине AirConsole

> Время проверки обычно несколько дней.
> На стадии черновика (**Draft**) игра доступна только тебе и администраторам, которых ты добавишь в поле **Administrators**.

### Добавить тестировщика (без публикации)

В поле **Administrators** введи email человека — он получит доступ к черновику игры.

---

## Итоговый чеклист

- [ ] `npm run build` выполнен, папка `dist/` создана
- [ ] В `dist/` есть `screen.html` и `controller.html`
- [ ] ZIP-архив создан из содержимого `dist/`
- [ ] Аккаунт на [airconsole.com/developers](https://www.airconsole.com/developers) создан
- [ ] Игра создана (Game ID, название, описание заполнены)
- [ ] Cover Art (512×512) загружен
- [ ] Screenshot (1280×720) загружен
- [ ] ZIP-архив загружен → нажата "Update Draft"
- [ ] Протестировано через симулятор
- [ ] Протестировано с реальными телефонами
- [ ] Нажата кнопка публикации / отправки на проверку

---

## Полезные ссылки

- [Developer Portal](https://www.airconsole.com/developers) — загрузка и управление играми
- [Quick Start Guide](https://developers.airconsole.com/quick-start) — официальная документация
- [AirConsole API Reference](https://airconsole.github.io/airconsole-api/) — полная документация SDK
- [AirConsole Simulator](https://www.airconsole.com/simulator) — тест без телефонов
- [ngrok](https://ngrok.com) — HTTPS туннель для локальной разработки (бесплатный план есть)

---

*Создано: 2026-05-08*
