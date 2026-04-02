# Интеграция: Web-клиент (React / Vue / vanilla JS)

Инструкция для фронтенд-разработчиков по подключению чатов в пользовательский веб-клиент.

Сервис поддерживает два типа диалогов:
- **Support** — чат поддержки, создаётся пользователем
- **Order** — чат по заказу, создаётся автоматически бэкендом при создании заказа

## Общая схема

```
┌──────────────┐         REST          ┌──────────────────┐
│  Web Client  │◄─────────────────────►│  Chat Service    │
│  (браузер)   │◄─────────────────────►│  :8000           │
└──────────────┘      WebSocket        └──────────────────┘
```

Клиент использует два канала:
- **REST API** — создание диалога, загрузка истории, отправка сообщений (fallback)
- **WebSocket** — realtime-доставка сообщений, отправка сообщений (основной)

## 1. Авторизация

Все запросы требуют JWT-токен пользователя. Токен получается из вашей системы авторизации (LeafFlow auth) и должен содержать:

```json
{
  "sub": "42",
  "kind": "user",
  "roles": []
}
```

- `sub` — ID пользователя (строка)
- `kind` — всегда `"user"` для веб-клиента

### REST

Передавайте токен в заголовке:

```
Authorization: Bearer <token>
```

### WebSocket

Передавайте токен через query parameter:

```
ws://chat-service:8000/ws/chat?token=<token>
```

## 2. Жизненный цикл чата

### 2.1. Создание чата поддержки (support)

При открытии виджета «Поддержка» вызовите:

```http
POST /api/v1/chat/conversations/support
Authorization: Bearer <token>
```

Ответ:

```json
{
  "id": "a1b2c3d4-...",
  "topic_type": "support",
  "topic_id": null,
  "status": "open",
  "assignee_admin_id": null,
  "last_message_at": "2026-02-13T17:00:00+00:00",
  "created_at": "2026-02-13T16:00:00+00:00",
  "updated_at": "2026-02-13T17:00:00+00:00"
}
```

Этот эндпоинт идемпотентен: если у пользователя уже есть открытый support-диалог, он возвращается. Новый создаётся, только если открытых нет.

### 2.2. Чаты по заказам (order)

Чаты по заказам **создаются автоматически бэкендом** при создании заказа (через событие `order.created` в Redis Stream). Клиенту не нужно вызывать никакие эндпоинты для создания — диалог уже будет в списке.

Отличия от support-чата:

| Свойство | Support | Order |
|----------|---------|-------|
| `topic_type` | `"support"` | `"order"` |
| `topic_id` | `null` | ID заказа (`12345`) |
| Создание | Пользователь через `POST /support` | Бэкенд через событие |
| Системные сообщения | Назначение/закрытие | Статусы заказа + назначение/закрытие |

Диалог по заказу содержит **автоматические системные сообщения** при смене статуса:

```json
{
  "type": "system",
  "body": "Заказ отправлен (#12345)",
  "sender_kind": "admin",
  "sender_id": 0
}
```

Системные сообщения имеют `sender_id: 0` — это служебный аккаунт.

**Как открыть чат по заказу на странице заказа:**

1. Загрузить список диалогов: `GET /api/v1/chat/conversations`
2. Найти диалог с `topic_type === "order"` и `topic_id === orderId`
3. Если найден — открыть, загрузить историю, подписаться через WS
4. Если не найден — диалог ещё не создан (событие ещё не обработано), показать заглушку или кнопку «Написать в поддержку»

```javascript
async function getOrderChat(orderId) {
  const convs = await fetchConversations();
  return convs.find(c => c.topic_type === "order" && c.topic_id === orderId);
}
```

### 2.3. Загрузка истории сообщений

```http
GET /api/v1/chat/conversations/{conversation_id}/messages?limit=50
Authorization: Bearer <token>
```

Ответ — массив сообщений, отсортированных по `created_at ASC`:

```json
[
  {
    "id": "msg-uuid-1",
    "conversation_id": "conv-uuid",
    "sender_kind": "user",
    "sender_id": 42,
    "type": "text",
    "body": "Привет!",
    "payload": null,
    "client_msg_id": "client-uuid-1",
    "created_at": "2026-02-13T16:01:00+00:00"
  },
  {
    "id": "msg-uuid-2",
    "conversation_id": "conv-uuid",
    "sender_kind": "admin",
    "sender_id": 1,
    "type": "text",
    "body": "Здравствуйте! Чем могу помочь?",
    "payload": null,
    "client_msg_id": "client-uuid-2",
    "created_at": "2026-02-13T16:02:00+00:00"
  }
]
```

**Пагинация**: для подгрузки более старых сообщений используйте параметр `cursor`:

```http
GET /api/v1/chat/conversations/{id}/messages?cursor=<cursor_token>&limit=50
```

**Формат курсора:**
`cursor` — это URL-safe Base64 закодированная строка формата `<timestamp>|<uuid>`, где:
- `<timestamp>` — `created_at` последнего полученного сообщения (в формате ISO 8601).
- `<uuid>` — `id` последнего полученного сообщения.

*Пример формирования курсора:*
Исходная строка: `2026-02-21T16:01:00+00:00|msg-uuid-1`
В закодированном виде (URL-safe Base64): `MjAyNi0wMi0yMVQxNjowMTowMCswMDowMHxtc2ctdXVpZC0x`

> **Примечание:** Сервер автоматически обрабатывает потерю символов выравнивания `=` (padding) в конце Base64 строки, если клиент или браузер отрезают их при формировании URL.

### 2.4. Список диалогов пользователя

```http
GET /api/v1/chat/conversations?limit=20
Authorization: Bearer <token>
```

Возвращает массив `ConversationResponse[]`, отсортированный по `last_message_at DESC`. В списке будут все диалоги пользователя — и support, и order.

Рекомендуемое отображение в UI:

```javascript
function renderConversationItem(conv) {
  if (conv.topic_type === "order") {
    return `Заказ #${conv.topic_id}`;
  }
  return "Чат поддержки";
}
```

## 3. WebSocket: подключение и работа

### 3.1. Подключение

```javascript
const token = getAuthToken();
const ws = new WebSocket(`ws://chat-service:8000/ws/chat?token=${token}`);
```

При невалидном токене сервер закроет соединение с кодом `4001`.

### 3.2. Подписка на диалог

После получения `conversation_id` (из шага 2.1) подпишитесь:

```javascript
ws.send(JSON.stringify({
  type: "subscribe",
  data: { conversation_id: conversationId }
}));
```

Без подписки вы не будете получать `message.created` для этого диалога.

### 3.3. Отправка сообщения

```javascript
const clientMsgId = crypto.randomUUID();

ws.send(JSON.stringify({
  type: "message.send",
  data: {
    conversation_id: conversationId,
    client_msg_id: clientMsgId,
    type: "text",
    body: "Текст сообщения"
  }
}));
```

**Важно про `client_msg_id`:**
- Генерируется на клиенте (UUID v4)
- Это ключ идемпотентности: если сообщение с таким `client_msg_id` уже существует, дубль не создастся
- Сохраняйте `client_msg_id` до получения подтверждения, чтобы при обрыве повторить отправку

### 3.4. Получение сообщений

```javascript
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  switch (msg.type) {
    case "message.created":
      // msg.data.message — объект сообщения
      addMessageToChat(msg.data.message);
      break;

    case "conversation.updated":
      // msg.data.action — "assigned" | "closed"
      updateConversationStatus(msg.data);
      break;

    case "pong":
      // heartbeat, можно игнорировать
      break;

    case "error":
      // msg.data.code, msg.data.detail
      handleError(msg.data);
      break;
  }
};
```

### 3.5. Heartbeat

Сервер отправляет `pong` каждые 30 секунд. Если вы не получаете `pong` в течение ~90 секунд, считайте соединение потерянным и переподключайтесь.

Клиент может отправлять `ping` для проверки:

```javascript
ws.send(JSON.stringify({ type: "ping", data: {} }));
```

### 3.6. Отметка о прочтении

Когда пользователь просмотрел сообщения:

```javascript
ws.send(JSON.stringify({
  type: "mark_read",
  data: {
    conversation_id: conversationId,
    last_message_id: lastVisibleMessageId
  }
}));
```

## 4. REST fallback для отправки

Если WebSocket недоступен, отправляйте через REST:

```http
POST /api/v1/chat/conversations/{conversation_id}/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "client_msg_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "text",
  "body": "Текст сообщения"
}
```

Ответ `201 Created`:

```json
{
  "id": "msg-uuid",
  "conversation_id": "conv-uuid",
  "sender_kind": "user",
  "sender_id": 42,
  "type": "text",
  "body": "Текст сообщения",
  "payload": null,
  "client_msg_id": "550e8400-...",
  "created_at": "2026-02-13T17:05:00+00:00"
}
```

## 5. Рекомендуемая реализация

### Оптимистичное обновление UI

1. Пользователь нажимает "Отправить"
2. Сгенерировать `client_msg_id = crypto.randomUUID()`
3. Сразу показать сообщение в чате (со статусом "отправляется")
4. Отправить через WS `message.send`
5. Получить `message.created` — обновить статус на "доставлено"
6. Если через 5 секунд `message.created` не пришёл — повторить через REST

### Переподключение WebSocket

```javascript
function connect() {
  const ws = new WebSocket(`ws://...?token=${token}`);

  ws.onclose = () => {
    // exponential backoff: 1s, 2s, 4s, 8s, max 30s
    setTimeout(connect, getBackoffDelay());
  };

  ws.onopen = () => {
    resetBackoff();
    // переподписаться на активный диалог
    ws.send(JSON.stringify({
      type: "subscribe",
      data: { conversation_id: currentConversationId }
    }));
    // подгрузить сообщения, которые могли прийти пока WS был отключён
    fetchMissedMessages();
  };
}
```

### Подписка на чат заказа со страницы заказа

Если у вас на странице заказа есть виджет чата:

```javascript
async function initOrderChat(orderId) {
  // 1. Найти диалог по заказу
  const convs = await fetchConversations();
  const chat = convs.find(c => c.topic_type === "order" && c.topic_id === orderId);

  if (!chat) {
    showPlaceholder("Чат по заказу загружается...");
    // Диалог ещё не создан — можно поллить или ждать WS
    return;
  }

  // 2. Загрузить историю
  const messages = await fetchMessages(chat.id);
  renderMessages(messages);

  // 3. Подписаться на realtime
  ws.send(JSON.stringify({
    type: "subscribe",
    data: { conversation_id: chat.id }
  }));
}
```

### Дедупликация

При переподключении вы получите `message.created` для сообщений, которые, возможно, уже отображены. Используйте `client_msg_id` или `message.id` как ключ для дедупликации:

```javascript
const messageIds = new Set();

function addMessageToChat(message) {
  if (messageIds.has(message.id)) return;
  messageIds.add(message.id);
  renderMessage(message);
}
```

## 6. Типы сообщений

| `type` | Описание | `body` | `payload` |
|--------|----------|--------|-----------|
| `text` | Текстовое сообщение | Текст | null |
| `system` | Системное | Текст | null или `{"action": "..."}` |
| `attachment` | Вложение (TODO в MVP) | null | `{"url": "..."}` |

Для MVP отправляйте только `type: "text"`. Системные сообщения создаются сервером автоматически.

### Системные сообщения

Системные сообщения (`type: "system"`) генерируются автоматически в двух случаях:

**1. Действия администратора** (назначение, закрытие):

```json
{
  "type": "system",
  "body": "Назначен оператор",
  "sender_id": 5
}
```

**2. Изменение статуса заказа** (только в order-чатах):

```json
{
  "type": "system",
  "body": "Заказ отправлен (#12345)",
  "sender_id": 0
}
```

Возможные тексты статусов заказа:

| Текст | Описание |
|-------|----------|
| Заказ подтверждён | Заказ принят |
| Заказ в обработке | Собирается |
| Заказ отправлен | В пути |
| Заказ доставлен | Получен |
| Заказ завершён | Закрыт успешно |
| Заказ отменён | Отменён |
| Возврат оформлен | Оформлен возврат |

### Рекомендация по отображению

```javascript
function renderMessage(msg) {
  if (msg.type === "system") {
    // Центрированный блок, серый текст, без бабла
    return renderSystemMessage(msg.body);
  }
  if (msg.sender_kind === "user") {
    return renderUserBubble(msg);   // справа
  }
  return renderAdminBubble(msg);    // слева
}
```

## 7. Коды ошибок WebSocket

| `code` | Описание |
|--------|----------|
| `invalid_payload` | Невалидный JSON |
| `unknown_type` | Неизвестный тип сообщения |
| `invalid_data` | Отсутствуют обязательные поля |
| `send_failed` | Ошибка при сохранении сообщения (нет доступа, диалог не найден) |

## 8. HTTP-коды REST API

| Код | Описание |
|-----|----------|
| 200 | Успешный GET/PATCH |
| 201 | Сообщение создано |
| 401 | Невалидный или отсутствующий токен |
| 403 | Нет доступа (не участник диалога) |
| 404 | Диалог не найден |
| 422 | Ошибка валидации запроса |
