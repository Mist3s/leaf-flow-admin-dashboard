# Интеграция: Админ-панель

Инструкция для разработчиков административного интерфейса. Админ-панель позволяет операторам поддержки видеть все диалоги (support и order), назначать их на себя, отвечать пользователям и закрывать обращения.

## Общая схема

```
┌──────────────────┐       REST (admin)      ┌──────────────────┐
│  Admin Panel     │◄───────────────────────►│  Chat Service    │
│  (SPA / iframe)  │◄───────────────────────►│  :8000           │
└──────────────────┘       WebSocket         └──────────────────┘
```

Панель использует:
- **REST API** (`/api/v1/chat/admin/conversations/...`) — управление диалогами
- **WebSocket** (`/ws/chat`) — realtime-уведомления о новых сообщениях

## 1. Авторизация

Админ-токен (JWT) должен содержать:

```json
{
  "sub": "5",
  "kind": "admin",
  "roles": ["admin"]
}
```

| Поле | Описание |
|------|----------|
| `sub` | ID администратора (строка) |
| `kind` | Должно быть `"admin"` |
| `roles` | Массив, содержащий `"admin"` |

Одного из условий достаточно: `kind == "admin"` **или** `"admin" in roles`.

### REST

```
Authorization: Bearer <admin_token>
```

Все эндпоинты `/api/v1/chat/admin/*` проверяют, что вызывающий является администратором. При отсутствии права доступа возвращается `403 Forbidden`.

### WebSocket

```
ws://chat-service:8000/ws/chat?token=<admin_token>
```

WebSocket-протокол единый для пользователей и администраторов. Отличие — админ может подписываться на любой диалог.

## 2. Список диалогов

### 2.1. Получить все диалоги (с фильтрами)

```http
GET /api/v1/chat/admin/conversations
Authorization: Bearer <admin_token>
```

**Query-параметры:**

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|-------------|----------|
| `status` | `open` / `closed` | — | Фильтр по статусу |
| `assignee_admin_id` | `int` | — | Фильтр по назначенному администратору |
| `cursor` | `string` | — | Курсор для пагинации |
| `limit` | `int` | 20 | Кол-во записей (1–100) |

**Примеры запросов:**

Все открытые:
```http
GET /api/v1/chat/admin/conversations?status=open&limit=50
```

Назначенные на текущего админа:
```http
GET /api/v1/chat/admin/conversations?assignee_admin_id=5&status=open
```

Неназначенные (очередь):
```http
GET /api/v1/chat/admin/conversations?status=open&assignee_admin_id=0
```

**Ответ:**

```json
[
  {
    "id": "conv-uuid-1",
    "topic_type": "support",
    "topic_id": null,
    "status": "open",
    "assignee_admin_id": null,
    "last_message_at": "2026-02-13T17:30:00+00:00",
    "created_at": "2026-02-13T16:00:00+00:00",
    "updated_at": "2026-02-13T17:30:00+00:00"
  },
  {
    "id": "conv-uuid-2",
    "topic_type": "order",
    "topic_id": 12345,
    "status": "open",
    "assignee_admin_id": 5,
    "last_message_at": "2026-02-13T17:25:00+00:00",
    "created_at": "2026-02-13T15:00:00+00:00",
    "updated_at": "2026-02-13T17:25:00+00:00"
  }
]
```

**Типы диалогов в списке:**

| `topic_type` | `topic_id` | Описание | Рекомендация по UI |
|--------------|-----------|----------|-------------------|
| `support` | `null` | Чат поддержки | Иконка поддержки, текст «Поддержка» |
| `order` | ID заказа | Чат по заказу | Иконка заказа, текст «Заказ #12345» |

Заказные чаты создаются бэкендом автоматически (через событие `order.created`). В них могут появляться системные сообщения об изменении статуса заказа.

**Пагинация (cursor-based):** если возвращён непустой список, для следующей страницы используйте `cursor` из ответа (по `last_message_at + id` последнего элемента). Если элементов меньше, чем `limit`, значит вы на последней странице.

### 2.2. Получить конкретный диалог

```http
GET /api/v1/chat/admin/conversations/{conversation_id}
Authorization: Bearer <admin_token>
```

Ответ — объект `ConversationResponse`.

## 3. Управление диалогом

### 3.1. Назначить на администратора

```http
PATCH /api/v1/chat/admin/conversations/{conversation_id}
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "assignee_admin_id": 5
}
```

Сервер:
1. Обновляет `assignee_admin_id` в БД
2. Добавляет администратора как участника диалога (если ещё не участник)
3. Создаёт системное сообщение `{"type": "system", "body": "Назначен оператор"}`
4. Записывает событие `conversation.updated` в outbox
5. Событие доставляется через Redis Pub/Sub → WebSocket подписчикам

Ответ — обновлённый `ConversationResponse`:

```json
{
  "id": "conv-uuid",
  "topic_type": "support",
  "topic_id": null,
  "status": "open",
  "assignee_admin_id": 5,
  "last_message_at": "2026-02-13T17:35:00+00:00",
  "created_at": "2026-02-13T16:00:00+00:00",
  "updated_at": "2026-02-13T17:35:00+00:00"
}
```

### 3.2. Закрыть диалог

```http
PATCH /api/v1/chat/admin/conversations/{conversation_id}
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "closed"
}
```

Сервер:
1. Устанавливает `status = "closed"`
2. Создаёт системное сообщение
3. Записывает событие `conversation.updated` с `action: "closed"` в outbox
4. Пользователь получит это событие через WebSocket

## 4. Сообщения

### 4.1. Загрузка истории

```http
GET /api/v1/chat/admin/conversations/{conversation_id}/messages?limit=100
Authorization: Bearer <admin_token>
```

Формат ответа идентичен пользовательскому API:

```json
[
  {
    "id": "msg-uuid",
    "conversation_id": "conv-uuid",
    "sender_kind": "user",
    "sender_id": 42,
    "type": "text",
    "body": "У меня проблема с заказом #123",
    "payload": null,
    "client_msg_id": "client-uuid",
    "created_at": "2026-02-13T16:01:00+00:00"
  },
  {
    "id": "msg-uuid-2",
    "conversation_id": "conv-uuid",
    "sender_kind": "admin",
    "sender_id": 5,
    "type": "text",
    "body": "Здравствуйте! Уточните номер заказа.",
    "payload": null,
    "client_msg_id": "client-uuid-2",
    "created_at": "2026-02-13T16:05:00+00:00"
  }
]
```

### 4.2. Отправка ответа через REST

```http
POST /api/v1/chat/admin/conversations/{conversation_id}/messages
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "client_msg_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "text",
  "body": "Спасибо за обращение! Проблема решена."
}
```

Ответ `201 Created` — объект `MessageResponse`.

**Идемпотентность**: повторный запрос с тем же `client_msg_id` от того же `sender_kind + sender_id` вернёт существующее сообщение, а не создаст дубль.

### 4.3. Отправка ответа через WebSocket

Подпишитесь и отправьте:

```javascript
// Подписка
ws.send(JSON.stringify({
  type: "subscribe",
  data: { conversation_id: conversationId }
}));

// Отправка
ws.send(JSON.stringify({
  type: "message.send",
  data: {
    conversation_id: conversationId,
    client_msg_id: crypto.randomUUID(),
    type: "text",
    body: "Ваш ответ..."
  }
}));
```

## 5. WebSocket: realtime-поток событий

### 5.1. Подключение

```javascript
const ws = new WebSocket(`ws://chat-service:8000/ws/chat?token=${adminToken}`);
```

### 5.2. Подписка на несколько диалогов

Админ может подписаться на все открытые диалоги одновременно, отправляя `subscribe` для каждого:

```javascript
openConversations.forEach((conv) => {
  ws.send(JSON.stringify({
    type: "subscribe",
    data: { conversation_id: conv.id }
  }));
});
```

### 5.3. Входящие события

```javascript
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  switch (msg.type) {
    case "message.created":
      // Новое сообщение в одном из подписанных диалогов
      // msg.data.conversation_id — UUID диалога
      // msg.data.message — полный объект сообщения
      handleNewMessage(msg.data);
      break;

    case "conversation.updated":
      // Диалог обновлён (назначен/закрыт другим админом)
      // msg.data.conversation_id, msg.data.action
      handleConversationUpdate(msg.data);
      break;

    case "pong":
      break;

    case "error":
      console.error("WS error:", msg.data);
      break;
  }
};
```

### 5.4. Типичный сценарий работы админа

1. Загрузить список открытых диалогов через `GET /admin/conversations?status=open`
2. Подключить WebSocket с admin-токеном
3. Подписаться на все открытые диалоги (`subscribe`)
4. При появлении нового `message.created` — показать уведомление
5. Админ открывает диалог → загрузить историю через `GET .../messages`
6. Назначить диалог на себя → `PATCH` с `assignee_admin_id`
7. Ответить через WS `message.send` или REST `POST .../messages`
8. Закрыть диалог → `PATCH` с `status: "closed"`

## 6. Отметка о прочтении

Через WebSocket:

```javascript
ws.send(JSON.stringify({
  type: "mark_read",
  data: {
    conversation_id: conversationId,
    last_message_id: lastVisibleMessageId
  }
}));
```

Это позволяет отслеживать, какие сообщения админ уже видел.

## 7. Типы сообщений и их отображение

| `type` | `sender_kind` | `sender_id` | Описание | Рекомендация по UI |
|--------|---------------|-------------|----------|--------------------|
| `text` | `user` | ID юзера | Текст от пользователя | Стандартный бабл слева |
| `text` | `admin` | ID админа | Текст от оператора | Стандартный бабл справа |
| `system` | `admin` | ID админа | Действие оператора (assign/close) | Центрированный серый блок |
| `system` | `admin` | `0` | Системное (статус заказа) | Центрированный серый блок |
| `attachment` | любой | — | Вложение (будущее) | Превью файла |

### Системные сообщения: два источника

**1. Действия администратора** — при `PATCH` (assign, close):

```json
{
  "type": "system",
  "body": "Диалог закрыт",
  "sender_id": 5
}
```

**2. Статус заказа** — автоматически от бэкенда (только в order-чатах):

```json
{
  "type": "system",
  "body": "Заказ отправлен (#12345)",
  "sender_id": 0
}
```

Отличить их можно по `sender_id`: `0` — автоматическое, `> 0` — действие конкретного администратора.

Возможные тексты статусов заказа:

| Текст | Когда приходит |
|-------|---------------|
| Заказ подтверждён (#ID) | Бэкенд подтвердил заказ |
| Заказ в обработке (#ID) | Заказ собирается |
| Заказ отправлен (#ID) | Передан в доставку |
| Заказ доставлен (#ID) | Доставлен клиенту |
| Заказ завершён (#ID) | Успешно закрыт |
| Заказ отменён (#ID) | Отменён |
| Возврат оформлен (#ID) | Оформлен возврат |

## 8. HTTP-коды

| Код | Описание |
|-----|----------|
| 200 | Успешный GET / PATCH |
| 201 | Сообщение создано |
| 401 | Невалидный или отсутствующий токен |
| 403 | Вызывающий не является администратором |
| 404 | Диалог не найден |
| 422 | Ошибка валидации |

## 9. Рекомендации

### Обновление списка диалогов в реальном времени

Когда приходит `message.created` по WebSocket, обновляйте `last_message_at` в списке диалогов и пересортируйте:

```javascript
function onNewMessage(data) {
  const conv = conversations.find(c => c.id === data.conversation_id);
  if (conv) {
    conv.last_message_at = data.message.created_at;
    conversations.sort((a, b) =>
      new Date(b.last_message_at) - new Date(a.last_message_at)
    );
    renderConversationList();
  } else {
    // Новый диалог — подгрузить через GET и подписаться
    fetchAndSubscribe(data.conversation_id);
  }
}
```

### Polling fallback

Если WebSocket недоступен, используйте polling:

```javascript
setInterval(async () => {
  const convs = await fetch("/api/v1/chat/admin/conversations?status=open", {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json());
  updateConversationList(convs);
}, 10000); // каждые 10 секунд
```

### Отображение заголовка диалога

```javascript
function getConversationTitle(conv) {
  if (conv.topic_type === "order") {
    return `Заказ #${conv.topic_id}`;
  }
  return `Поддержка (пользователь)`;
}
```

### Сценарий работы с order-чатом

1. Пользователь оформляет заказ → бэкенд публикует `order.created`
2. Chat Service создаёт диалог → он появляется в списке админки
3. Бэкенд меняет статус заказа → в чат приходят системные сообщения автоматически
4. Пользователь пишет вопрос → админ видит `message.created` по WebSocket
5. Админ назначает диалог на себя → `PATCH`
6. Админ отвечает → `message.send`
7. Заказ завершён → в чат приходит «Заказ завершён (#12345)»
8. Админ закрывает диалог → `PATCH` с `status: "closed"`

### Конкурентное назначение

Два админа могут одновременно попытаться назначить диалог на себя. Побеждает тот, чей PATCH обработается последним (last-write-wins). Оба получат `conversation.updated` через WebSocket и увидят актуальное состояние.
