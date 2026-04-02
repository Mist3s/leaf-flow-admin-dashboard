# Архитектура проекта

## Структура директорий
- `/src/api` — Клиент Axios, конфигурация и модули сервисов (группировка по сущностям: auth, products, orders).
- `/src/components` — Переиспользуемые обобщенные компоненты (DataTable, Dialogs).
- `/src/content` — Страницы (Pages). Разделены на защищенные (`admin`) и публичные (`pages/Auth`).
- `/src/contexts` — Глобальные стейты React-приложения (Auth, Sidebar).
- `/src/layouts` — Обертки страниц (BaseLayout для гостевых, SidebarLayout для админ-панели).
- `/src/theme` — Настройки темы Material-UI.

## Роутинг
Используется `react-router-dom` v6.
- Корневые маршруты определены в `src/router.tsx` как массив объектов (рендерится через хук `useRoutes` в `App.tsx`).
- Применяется ленивая загрузка страниц модулей через `React.lazy` и `SuspenseLoader`.
- Роуты разделены на Layout-ы:
  - `BaseLayout` — для публичных страниц.
  - `SidebarLayout` — обернут в `ProtectedRoute` для ограничения доступа неавторизованным пользователям.

## Работа с API
- Единый инстанс Axios в `src/api/client.ts`.
- **Интерцепторы (interceptors):**
  - *Request:* Автоматически добавляют заголовок `Authorization: Bearer <token>` к каждому запросу.
  - *Response:* При получении 401 (Unauthorized) происходит автоматическое стирание токена и редирект на `/login`.
- Сервисы инкапсулируют HTTP вызовы внутри `src/api/services/`.

## Управление состоянием
- **Локальное состояние:** `useState` внутри компонентов.
- **Глобальный UI/Auth стейт:** React Context API (`AuthContext`, `SidebarContext`).
- **Серверное состояние:** Упоминается `React Query` (по json) для управления внешними данными и кешированием.

## Аутентификация
- Аутентификация токен-based.
- Токен сохраняется в `localStorage`.
- Инициализация и проверка сессии реализована через хук/провайдер `AuthContext` (`checkAuth()`).
