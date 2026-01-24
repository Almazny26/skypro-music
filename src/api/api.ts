// URL бэкенда, который нам дали для проекта
const API_BASE_URL = 'https://webdev-music-003b5b991590.herokuapp.com';

// Типы для запросов и ответов API - чтобы TypeScript понимал структуру данных
export interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  username: string;
  email: string;
}

export interface Track {
  _id: number;
  name: string;
  author: string;
  album: string;
  duration_in_seconds: number;
  track_file: string;
  release_date?: string;
  genre?: string[];
  logo?: string | null;
  stared_user?: number[];
}

export interface TracksResponse {
  success?: boolean;
  data?: Track[];
  items?: Track[];
  // Бэкенд иногда возвращает данные в разных форматах, поэтому делаю так
  [key: string]: any;
}

export interface CompilationResponse {
  id: number;
  name: string;
  owner: string;
  tracks: Track[];
}

// Получаю токен из localStorage - проверяю window, потому что Next.js рендерит на сервере
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

// Сохраняю токен после успешной авторизации
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', token);
}

// Сохраняю данные пользователя и отправляю событие, чтобы компоненты обновились
// Делаю проверки на undefined/null, потому что иногда API возвращает странные значения
export function setUserInfo(username: string, email: string): void {
  if (typeof window === 'undefined') return;
  
  // Проверяю, что username валидный - иначе в интерфейсе будет "undefined"
  if (username && username !== 'undefined' && username !== 'null' && username.trim() !== '') {
    const trimmedUsername = username.trim();
    localStorage.setItem('username', trimmedUsername);
    // Отправляю событие, чтобы Sidebar и другие компоненты обновились без перезагрузки
    window.dispatchEvent(new Event('localStorageChange'));
  }
  if (email && email !== 'undefined' && email !== 'null' && email.trim() !== '') {
    localStorage.setItem('userEmail', email.trim());
  }
}

// Получаю username для отображения в интерфейсе
export function getUsername(): string | null {
  if (typeof window === 'undefined') return null;
  const username = localStorage.getItem('username');
  // Фильтрую некорректные значения - иногда localStorage хранит строку "undefined"
  if (username === 'undefined' || username === 'null' || !username) {
    return null;
  }
  return username;
}

// Очищаю все данные при выходе и отправляю событие для обновления UI
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('username');
  localStorage.removeItem('userEmail');
  // Компоненты должны обновиться и показать "Гость" вместо имени
  window.dispatchEvent(new Event('localStorageChange'));
}

// Обертка для всех запросов к API - добавляю токен и обрабатываю ошибки
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  // Если есть токен, добавляю его в заголовки для авторизованных запросов
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: headers as HeadersInit,
      cache: 'no-store', // Отключаю кеш, чтобы всегда получать свежие данные
    });
  } catch (networkError) {
    // Если нет интернета или сервер недоступен - показываю понятное сообщение
    throw new Error('Не удалось подключиться к серверу. Проверьте подключение к интернету.');
  }

  if (!response.ok) {
    let errorMessage = `Ошибка: ${response.status}`;
    
    // Обрабатываю разные статусы - для каждого свое сообщение пользователю
    if (response.status === 401) {
      errorMessage = 'Неверный email или пароль';
    } else if (response.status === 403) {
      errorMessage = 'Доступ запрещен';
    } else if (response.status === 404) {
      errorMessage = 'Ресурс не найден';
    } else if (response.status === 500) {
      errorMessage = 'Ошибка сервера. Попробуйте позже';
    } else if (response.status === 503) {
      errorMessage = 'Сервис временно недоступен. Попробуйте позже';
    }
    
    try {
      const text = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch {
        // Если ответ не JSON (например, plain text), использую его как есть
        if (text && text.trim()) {
          errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      // Бэкенд возвращает ошибки в разных форматах, поэтому проверяю все варианты
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData.data?.errors) {
        // Формат с вложенными ошибками по полям - собираю их в одно сообщение
        const errors = errorData.data.errors;
        const errorMessages: string[] = [];
        for (const [field, messages] of Object.entries(errors)) {
          if (Array.isArray(messages) && messages.length > 0) {
            // Перевожу названия полей на русский, чтобы пользователю было понятнее
            const fieldName =
              field === 'password'
                ? 'Пароль'
                : field === 'username'
                ? 'Имя пользователя'
                : field === 'email'
                ? 'Email'
                : field;
            errorMessages.push(`${fieldName}: ${messages[0]}`);
          } else if (typeof messages === 'string') {
            const fieldName =
              field === 'password'
                ? 'Пароль'
                : field === 'username'
                ? 'Имя пользователя'
                : field === 'email'
                ? 'Email'
                : field;
            errorMessages.push(`${fieldName}: ${messages}`);
          }
        }
        // Объединяю все ошибки в одну строку
        errorMessage =
          errorMessages.length > 0
            ? errorMessages.join(', ')
            : errorData.message || errorMessage;
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      } else if (Array.isArray(errorData) && errorData.length > 0) {
        errorMessage = Array.isArray(errorData[0])
          ? errorData[0][0]
          : String(errorData[0]);
      } else if (typeof errorData === 'object') {
        // Если структура незнакомая, пытаюсь извлечь хоть какое-то сообщение
        const keys = Object.keys(errorData);
        if (keys.length > 0) {
          const firstKey = keys[0];
          const firstValue = errorData[firstKey];
          if (Array.isArray(firstValue) && firstValue.length > 0) {
            errorMessage = String(firstValue[0]);
          } else if (typeof firstValue === 'string') {
            errorMessage = firstValue;
          } else {
            // В крайнем случае показываю JSON - лучше что-то, чем ничего
            errorMessage = `Ошибка в поле "${firstKey}": ${JSON.stringify(
              firstValue,
            )}`;
          }
        } else {
          errorMessage = JSON.stringify(errorData);
        }
      }
    } catch (parseError) {
      // Если вообще ничего не получилось распарсить - оставляю стандартное сообщение
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// Вход в систему - принимает email или username
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  return fetchAPI<AuthResponse>('/user/login/', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

// Регистрация нового пользователя
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  // Бэкенд требует username, но мы получаем только email
  // Поэтому беру часть до @ как username
  let username: string;
  if (data.email.includes('@')) {
    username = data.email.split('@')[0];
  } else {
    username = data.email;
  }

  const requestData = {
    username: username,
    email: data.email,
    password: data.password,
  };

  return fetchAPI<AuthResponse>('/user/signup/', {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
}

// Получаю все треки с главной страницы
export async function getTracks(): Promise<Track[]> {
  const response = await fetchAPI<TracksResponse>('/catalog/track/all/');

  // Бэкенд иногда возвращает данные в разных форматах, проверяю все варианты
  if (Array.isArray(response)) {
    return response;
  }

  // Обычно возвращает {success: true, data: [...]}
  if (response.data && Array.isArray(response.data)) {
    return response.data;
  }

  // Иногда старый формат с items
  if (response.items && Array.isArray(response.items)) {
    return response.items;
  }

  // Если ничего не подошло - возвращаю пустой массив, чтобы не сломать приложение
  if (process.env.NODE_ENV === 'development') {
    console.warn('Неожиданная структура ответа API:', response);
  }
  return [];
}

// Получаю треки конкретной подборки по ID
export async function getCompilationTracks(
  compilationId: number,
): Promise<Track[]> {
  const response = await fetchAPI<CompilationResponse>(
    `/catalog/selection/${compilationId}/`,
  );
  return response.tracks;
}

// Получаю список всех подборок (пока не используется, но может пригодиться)
export async function getCompilations(): Promise<CompilationResponse[]> {
  return fetchAPI<CompilationResponse[]>('/catalog/selection/');
}
