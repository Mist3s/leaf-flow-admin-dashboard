# Интеграция: Backend-сервисы

Инструкция для разработчиков других микросервисов платформы LeafFlow, которым необходимо взаимодействовать с Chat Service: отправлять события, реагировать на события чата, или использовать REST API сервиса.

## Общая схема

```
┌──────────────────┐                      ┌──────────────────┐
│  LeafFlow Core   │─── Redis Streams ───►│  Chat Service    │
│  (другой сервис) │                      │  Consumer Worker │
└──────────────────┘                      └──────────────────┘

┌──────────────────┐                      ┌──────────────────┐
│  Chat Service    │─── Redis Pub/Sub ───►│  Любой подписчик │
│  Outbox Worker   │                      │  (ваш сервис)    │
└──────────────────┘                      └──────────────────┘

┌──────────────────┐                      ┌──────────────────┐
│  Ваш сервис      │──── REST API ───────►│  Chat Service    │
│                  │                      │  :8000           │
└──────────────────┘                      └──────────────────┘
```

Три способа интеграции:
1. **Redis Streams** — отправка внешних событий в Chat Service (основной)
2. **Redis Pub/Sub** — подписка на внутренние события чата
3. **REST API** — прямые HTTP-вызовы к Chat Service

## 1. Отправка событий в Chat Service (Redis Streams)

Chat Service потребляет внешние события из Redis Stream. Это основной способ уведомить чат о событиях в платформе.

### 1.1. Конфигурация

| Параметр | Значение по умолчанию | Описание |
|----------|-----------------------|----------|
| `LEAF_EVENTS_STREAM` | `leaf.events` | Имя Redis Stream |
| `LEAF_EVENTS_GROUP` | `chat-service` | Consumer group чат-сервиса |

### 1.2. Формат сообщения

Chat Service ожидает, что каждое сообщение в стриме содержит поле `event_type` и произвольные поля данных:

```
XADD leaf.events * event_type user.blocked user_id 42 reason "spam"
```

Эквивалент на Python (redis-py):

```python
import redis.asyncio as aioredis

redis = aioredis.from_url("redis://redis:6379/0", decode_responses=True)

await redis.xadd("leaf.events", {
    "event_type": "user.blocked",
    "user_id": "42",
    "reason": "spam",
})
```

### 1.3. Поддерживаемые типы событий

| `event_type` | Описание | Обязательные поля |
|--------------|----------|-------------------|
| `order.created` | Создан заказ — чат-сервис создаёт диалог по заказу | `user_id`, `order_id` |
| `order.status_changed` | Статус заказа изменён — системное сообщение в чат | `order_id`, `status` |
| `user.blocked` | Пользователь заблокирован | `user_id` |
| `user.updated` | Данные пользователя обновлены | `user_id` |

Для `order.status_changed` опциональное поле `old_status` — предыдущий статус (для логирования).

Поддерживаемые значения `status` с автоматическими текстами:

| `status` | Текст в чате |
|----------|-------------|
| `confirmed` | Заказ подтверждён |
| `processing` | Заказ в обработке |
| `shipped` | Заказ отправлен |
| `delivered` | Заказ доставлен |
| `completed` | Заказ завершён |
| `cancelled` | Заказ отменён |
| `refunded` | Возврат оформлен |

Неизвестные статусы отображаются как «Статус заказа: {status}».

Неизвестные типы событий логируются на уровне `DEBUG` и игнорируются. Вы можете добавлять новые типы, расширяя обработчик в `leaf_events_consumer.py`.

### 1.4. Гарантии доставки

- **At-least-once**: Chat Service использует `XREADGROUP` + `XACK`. Если обработка упала, сообщение будет повторно доставлено
- **Идемпотентность**: ваши обработчики должны быть идемпотентными. Одно и то же сообщение может быть обработано дважды
- **Блокировка**: consumer блочно ждёт новые сообщения (`BLOCK 5000 мс`), batch size = 10

### 1.5. Создание consumer group

Consumer group создаётся автоматически при старте `leaf_events_consumer`. Если нужно создать заранее:

```bash
# Через скрипт
python -m chat_service.scripts.create_consumer_group

# Через redis-cli
redis-cli XGROUP CREATE leaf.events chat-service $ MKSTREAM
```

### 1.6. Пример: создание чата при создании заказа

Сервис заказов публикует событие:

```python
await redis.xadd("leaf.events", {
    "event_type": "order.created",
    "user_id": "42",
    "order_id": "12345",
})
```

Chat Service автоматически:
1. Подхватывает событие из stream через `leaf_events_consumer`
2. Вызывает `get_or_create_topic_conversation("order", 12345, user_id=42)`
3. Создаёт диалог с `topic_type="order"`, `topic_id=12345`
4. Добавляет пользователя как участника
5. Публикует `conversation.created` в outbox → Redis Pub/Sub

Пользователь увидит новый диалог в списке при следующем `GET /conversations` или через WebSocket.

### 1.7. Добавление нового типа события

Для обработки новых событий отредактируйте `src/chat_service/workers/leaf_events_consumer.py`:

```python
async def _handle_event(event_type: str, fields: dict[str, Any]) -> None:
    if event_type == "user.blocked":
        await _handle_user_blocked(fields)
    elif event_type == "order.created":
        await _handle_order_created(fields)
    elif event_type == "payment.failed":       # ← новый обработчик
        await _handle_payment_failed(fields)
    else:
        logger.debug("Ignoring unknown event: %s", event_type)
```

## 2. Подписка на события Chat Service (Redis Pub/Sub)

Chat Service публикует внутренние события через outbox worker в Redis Pub/Sub. Другие сервисы могут подписаться на этот канал.

### 2.1. Канал

| Параметр | Значение по умолчанию |
|----------|-----------------------|
| `REDIS_PUBSUB_CHANNEL` | `chat.fanout` |

### 2.2. Формат событий

Все события сериализуются в JSON:

```json
{
  "event": "message.created",
  "data": {
    "event_type": "message.created",
    "conversation_id": "a1b2c3d4-...",
    "message_id": "e5f6g7h8-...",
    "sender_kind": "user",
    "sender_id": 42,
    "body": "Текст сообщения"
  }
}
```

### 2.3. Типы событий

| Событие | Описание | Ключевые поля в `data` |
|---------|----------|------------------------|
| `message.created` | Создано новое сообщение | `conversation_id`, `message_id`, `sender_kind`, `sender_id`, `body` |
| `conversation.created` | Создан новый диалог | `conversation_id`, `user_id`, `topic_type` |
| `conversation.updated` | Диалог обновлён | `conversation_id`, `status`, `assignee_admin_id`, `action` |

Поле `action` в `conversation.updated`:
- `"assigned"` — назначен оператор
- `"closed"` — диалог закрыт
- `"reopened"` — диалог переоткрыт (зарезервировано)

### 2.4. Пример подписчика (Python)

```python
import asyncio
import json
import redis.asyncio as aioredis


async def listen_chat_events():
    redis = aioredis.from_url("redis://redis:6379/0", decode_responses=True)
    pubsub = redis.pubsub()
    await pubsub.subscribe("chat.fanout")

    try:
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue

            envelope = json.loads(message["data"])
            event_type = envelope["event"]
            data = envelope["data"]

            if event_type == "message.created":
                print(f"Новое сообщение в диалоге {data['conversation_id']}")
                # Например: отправить push-уведомление
            elif event_type == "conversation.created":
                print(f"Новый диалог от пользователя {data['user_id']}")
                # Например: оповестить дежурного админа
            elif event_type == "conversation.updated":
                print(f"Диалог {data['conversation_id']} — {data['action']}")
    finally:
        await pubsub.unsubscribe("chat.fanout")
        await pubsub.aclose()
        await redis.aclose()


asyncio.run(listen_chat_events())
```

### 2.5. Пример подписчика (Node.js)

```javascript
const Redis = require("ioredis");

const redis = new Redis("redis://redis:6379/0");

redis.subscribe("chat.fanout", (err) => {
  if (err) throw err;
  console.log("Subscribed to chat.fanout");
});

redis.on("message", (channel, message) => {
  const envelope = JSON.parse(message);
  const { event, data } = envelope;

  if (event === "message.created") {
    console.log(`New message in ${data.conversation_id}`);
    // Отправить push-уведомление
  }
});
```

### 2.6. Важные ограничения Pub/Sub

- **Fire-and-forget**: если ваш подписчик был офлайн в момент публикации, событие потеряно
- **Нет персистентности**: Redis Pub/Sub не сохраняет сообщения
- **Нет ack**: нет гарантии доставки

Если вам нужна гарантированная доставка, реализуйте отдельный Redis Streams consumer (аналогично `leaf_events_consumer`), а outbox worker адаптируйте для публикации в streams.

## 3. REST API для server-to-server вызовов

REST API предназначен для чтения данных и управления диалогами. Для создания диалогов используйте Redis Streams (раздел 1).

### 3.1. Аутентификация

Сгенерируйте service-level JWT с `kind: "admin"` и подписанный общим секретом (`JWT_SECRET`):

```python
import jwt
from datetime import datetime, timezone, timedelta

admin_token = jwt.encode(
    {
        "sub": "0",              # service account ID
        "kind": "admin",
        "roles": ["admin"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    },
    "your-jwt-secret",
    algorithm="HS256",
)
```

### 3.2. Доступные эндпоинты

#### Список диалогов

```python
response = httpx.get(
    "http://chat-service:8000/api/v1/chat/admin/conversations",
    params={"status": "open", "limit": 100},
    headers={"Authorization": f"Bearer {admin_token}"},
)
conversations = response.json()
```

#### Получить историю сообщений

```python
response = httpx.get(
    f"http://chat-service:8000/api/v1/chat/admin/conversations/{conversation_id}/messages",
    params={"limit": 200},
    headers={"Authorization": f"Bearer {admin_token}"},
)
messages = response.json()
```

#### Отправить сообщение в диалог (от имени системы)

```python
import uuid

response = httpx.post(
    f"http://chat-service:8000/api/v1/chat/admin/conversations/{conversation_id}/messages",
    json={
        "client_msg_id": str(uuid.uuid4()),
        "type": "text",
        "body": "Ваш заказ #123 доставлен!",
    },
    headers={"Authorization": f"Bearer {admin_token}"},
)
```

#### Назначить / закрыть диалог

```python
# Назначить на оператора
httpx.patch(
    f"http://chat-service:8000/api/v1/chat/admin/conversations/{conversation_id}",
    json={"assignee_admin_id": admin_id},
    headers={"Authorization": f"Bearer {admin_token}"},
)

# Закрыть
httpx.patch(
    f"http://chat-service:8000/api/v1/chat/admin/conversations/{conversation_id}",
    json={"status": "closed"},
    headers={"Authorization": f"Bearer {admin_token}"},
)
```

### 3.3. Health check

Используйте для проверки работоспособности Chat Service:

```python
# Liveness (всегда 200, если процесс жив)
response = httpx.get("http://chat-service:8000/healthz")

# Readiness (200, если Postgres + Redis доступны)
response = httpx.get("http://chat-service:8000/readyz")
```

Формат ответа readiness:

```json
{
  "status": "ok",
  "postgres": "ok",
  "redis": "ok"
}
```

Если один из компонентов недоступен:

```json
{
  "status": "degraded",
  "postgres": "ok",
  "redis": "unavailable"
}
```

HTTP-код: `503 Service Unavailable`.

## 4. Полный пример: жизненный цикл чата по заказу

Сценарий: при создании заказа автоматически создаётся чат, при завершении — отправляется уведомление.

### 4.1. Создание заказа → создание чата

Ваш сервис заказов:

```python
async def create_order(user_id: int, items: list) -> Order:
    order = await order_repo.create(user_id=user_id, items=items)

    await redis.xadd("leaf.events", {
        "event_type": "order.created",
        "user_id": str(user_id),
        "order_id": str(order.id),
    })

    return order
```

Chat Service подхватывает событие и создаёт диалог с `topic_type="order"`, `topic_id=order.id`.

### 4.2. Смена статуса → системное сообщение в чат

При каждом изменении статуса публикуйте событие:

```python
async def change_order_status(order_id: int, new_status: str) -> None:
    order = await order_repo.get(order_id)
    old_status = order.status
    order = await order_repo.update_status(order_id, new_status)

    await redis.xadd("leaf.events", {
        "event_type": "order.status_changed",
        "order_id": str(order.id),
        "status": new_status,
        "old_status": old_status,
    })
```

Chat Service находит диалог по `topic_type="order"` + `topic_id` и отправляет системное сообщение с человекочитаемым текстом (например, «Заказ отправлен (#12345)»).

### 4.3. Что видит пользователь

```
┌─────────────────────────────────────────┐
│  Диалог: Заказ #12345                   │
│─────────────────────────────────────────│
│                                         │
│  [система] Заказ подтверждён (#12345)   │
│                                         │
│  Пользователь: Когда доставка?          │
│                                         │
│  Оператор: Завтра до 18:00             │
│                                         │
│  [система] Заказ отправлен (#12345)     │
│                                         │
│  [система] Заказ доставлен (#12345)     │
│                                         │
│  Пользователь: Всё получил, спасибо!   │
│                                         │
│  [система] Заказ завершён (#12345)      │
│                                         │
└─────────────────────────────────────────┘
```

### 4.4. Диаграмма потока

```
Сервис заказов          Redis Stream          Chat Consumer       Postgres
      │                      │                      │                │
      │── XADD order.created─►│                      │                │
      │                      │──── XREADGROUP ──────►│                │
      │                      │                      │── INSERT conv ─►│
      │                      │                      │── INSERT part ─►│
      │                      │                      │── INSERT outbox►│
      │                      │                      │── XACK ────────►│
      │                      │                      │                │
      │── XADD order.status  ─►│                      │                │
      │   (confirmed)         │──── XREADGROUP ──────►│                │
      │                      │                      │── SELECT conv ─►│
      │                      │                      │── INSERT msg ──►│
      │                      │                      │── XACK ────────►│
      │                      │                      │                │
      │── XADD order.status  ─►│                      │                │
      │   (shipped)           │──── XREADGROUP ──────►│                │
      │                      │                      │── SELECT conv ─►│
      │                      │                      │── INSERT msg ──►│
      │                      │                      │── XACK ────────►│
```

Весь процесс полностью асинхронный. Ваш сервис просто публикует событие и продолжает работу.

## 5. Справочник API

### Пользовательские эндпоинты

| Метод | URL | Описание |
|-------|-----|----------|
| `POST` | `/api/v1/chat/conversations/support` | Создать/получить support-диалог |
| `GET` | `/api/v1/chat/conversations` | Список диалогов пользователя |
| `GET` | `/api/v1/chat/conversations/{id}` | Детали диалога |
| `GET` | `/api/v1/chat/conversations/{id}/messages` | Сообщения диалога |
| `POST` | `/api/v1/chat/conversations/{id}/messages` | Отправить сообщение |

### Админские эндпоинты

| Метод | URL | Описание |
|-------|-----|----------|
| `GET` | `/api/v1/chat/admin/conversations` | Список всех диалогов (с фильтрами) |
| `GET` | `/api/v1/chat/admin/conversations/{id}` | Детали диалога |
| `PATCH` | `/api/v1/chat/admin/conversations/{id}` | Назначить / закрыть |
| `GET` | `/api/v1/chat/admin/conversations/{id}/messages` | Сообщения диалога |
| `POST` | `/api/v1/chat/admin/conversations/{id}/messages` | Отправить ответ |

### Служебные

| Метод | URL | Описание |
|-------|-----|----------|
| `GET` | `/healthz` | Liveness probe |
| `GET` | `/readyz` | Readiness probe |
| `WS` | `/ws/chat?token=...` | WebSocket |

## 6. Модель данных (для справки)

### Conversation

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Идентификатор |
| `topic_type` | string | `"support"`, `"order"` и т.д. |
| `topic_id` | int / null | Внешний идентификатор темы |
| `status` | `"open"` / `"closed"` | Статус диалога |
| `assignee_admin_id` | int / null | ID назначенного админа |
| `last_message_at` | datetime / null | Время последнего сообщения |
| `created_at` | datetime | Время создания |
| `updated_at` | datetime | Время обновления |

### Message

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Идентификатор |
| `conversation_id` | UUID | FK на диалог |
| `sender_kind` | `"user"` / `"admin"` | Тип отправителя |
| `sender_id` | int | ID отправителя |
| `type` | `"text"` / `"system"` / `"attachment"` | Тип сообщения |
| `body` | string / null | Текст |
| `payload` | object / null | Дополнительные данные (JSON) |
| `client_msg_id` | UUID | Ключ идемпотентности |
| `created_at` | datetime | Время создания |

## 7. Переменные окружения

Полный список для настройки Chat Service при развертывании:

| Переменная | Обязательная | Описание |
|------------|-------------|----------|
| `POSTGRES_USER` | да | Пользователь PostgreSQL |
| `POSTGRES_PASSWORD` | да | Пароль PostgreSQL |
| `POSTGRES_DB` | да | Имя базы данных |
| `DB_HOST` | нет (localhost) | Хост PostgreSQL |
| `DB_PORT` | нет (5432) | Порт PostgreSQL |
| `REDIS_URL` | нет (redis://localhost:6379/0) | URL Redis |
| `JWT_SECRET` | да | Секрет для HS256 |
| `JWT_VERIFY_MODE` | нет (hs256) | `hs256` или `jwks` |
| `JWKS_URL` | нет | URL для JWKS (если `jwks` mode) |
| `CORS_ORIGINS` | нет (["*"]) | Разрешённые CORS-источники |
| `REDIS_PUBSUB_CHANNEL` | нет (chat.fanout) | Канал Pub/Sub |
| `LEAF_EVENTS_STREAM` | нет (leaf.events) | Имя Redis Stream |
| `LEAF_EVENTS_GROUP` | нет (chat-service) | Consumer group |
| `OUTBOX_POLL_INTERVAL` | нет (1.0) | Интервал опроса outbox (сек) |
| `OUTBOX_BATCH_SIZE` | нет (50) | Размер batch outbox |
| `OUTBOX_MAX_ATTEMPTS` | нет (5) | Максимум попыток отправки |
| `WS_HEARTBEAT_SECONDS` | нет (30) | Интервал heartbeat WS |
