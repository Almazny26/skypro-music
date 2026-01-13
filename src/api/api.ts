// Базовый URL API
const API_BASE_URL = 'https://webdev-music-003b5b991590.herokuapp.com';

// Типы для API ответов
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
  // API может вернуть массив напрямую, объект с items или объект с data
  [key: string]: any;
}

export interface CompilationResponse {
  id: number;
  name: string;
  owner: string;
  tracks: Track[];
}

// Функция для получения токена из localStorage
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

// Функция для сохранения токена
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', token);
}

// Функция для сохранения информации о пользователе
export function setUserInfo(username: string, email: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('username', username);
  localStorage.setItem('userEmail', email);
  // Отправляем кастомное событие для обновления компонентов в той же вкладке
  window.dispatchEvent(new Event('localStorageChange'));
}

// Функция для получения username
export function getUsername(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('username');
}

// Функция для удаления токена
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('username');
  localStorage.removeItem('userEmail');
}

// Базовая функция для выполнения запросов
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: headers as HeadersInit,
    cache: 'no-store', // Отключаем кеширование для актуальных данных
  });

  if (!response.ok) {
    let errorMessage = `Ошибка: ${response.status}`;
    try {
      const text = await response.text();
      console.log('Ответ сервера (текст):', text);
      let errorData;
      try {
        errorData = JSON.parse(text);
        console.log('Ответ сервера (JSON):', errorData);
      } catch {
        // Если не JSON, используем текст как есть
        if (text) {
          errorMessage = text;
        }
        throw new Error(errorMessage);
      }
      
      // Обрабатываем разные форматы ошибок
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData.data?.errors) {
        // Формат: {"success":false,"message":"...","data":{"errors":{...}}}
        const errors = errorData.data.errors;
        const errorMessages: string[] = [];
        for (const [field, messages] of Object.entries(errors)) {
          if (Array.isArray(messages) && messages.length > 0) {
            // Переводим названия полей на русский для лучшего UX
            const fieldName = field === 'password' ? 'Пароль' : 
                            field === 'username' ? 'Имя пользователя' :
                            field === 'email' ? 'Email' : field;
            errorMessages.push(`${fieldName}: ${messages[0]}`);
          } else if (typeof messages === 'string') {
            const fieldName = field === 'password' ? 'Пароль' : 
                            field === 'username' ? 'Имя пользователя' :
                            field === 'email' ? 'Email' : field;
            errorMessages.push(`${fieldName}: ${messages}`);
          }
        }
        errorMessage = errorMessages.length > 0 
          ? errorMessages.join(', ') 
          : (errorData.message || errorMessage);
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      } else if (Array.isArray(errorData) && errorData.length > 0) {
        errorMessage = Array.isArray(errorData[0]) ? errorData[0][0] : String(errorData[0]);
      } else if (typeof errorData === 'object') {
        // Пытаемся найти первое сообщение об ошибке
        const keys = Object.keys(errorData);
        if (keys.length > 0) {
          const firstKey = keys[0];
          const firstValue = errorData[firstKey];
          if (Array.isArray(firstValue) && firstValue.length > 0) {
            errorMessage = String(firstValue[0]);
          } else if (typeof firstValue === 'string') {
            errorMessage = firstValue;
          } else {
            // Если это объект, попробуем найти вложенное сообщение
            errorMessage = `Ошибка в поле "${firstKey}": ${JSON.stringify(firstValue)}`;
          }
        } else {
          errorMessage = JSON.stringify(errorData);
        }
      }
    } catch (parseError) {
      // Если не удалось распарсить, используем стандартное сообщение
      console.error('Ошибка парсинга ответа:', parseError);
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// Авторизация пользователя
export async function login(
  credentials: LoginRequest
): Promise<AuthResponse> {
  return fetchAPI<AuthResponse>('/user/login/', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

// Регистрация пользователя
export async function register(
  data: RegisterRequest
): Promise<AuthResponse> {
  // API требует username обязательно
  // Извлекаем username из email (часть до @) или используем весь email
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
  
  console.log('Данные для регистрации:', { ...requestData, password: '***' });
  
  return fetchAPI<AuthResponse>('/user/signup/', {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
}

// Получение всех треков
export async function getTracks(): Promise<Track[]> {
  const response = await fetchAPI<TracksResponse>('/catalog/track/all/');
  console.log('Ответ API getTracks:', response);
  
  // Проверяем разные возможные структуры ответа
  if (Array.isArray(response)) {
    return response;
  }
  
  // API возвращает {success: true, data: [...]}
  if (response.data && Array.isArray(response.data)) {
    return response.data;
  }
  
  // Старый формат с items
  if (response.items && Array.isArray(response.items)) {
    return response.items;
  }
  
  // Если структура неожиданная, возвращаем пустой массив
  console.warn('Неожиданная структура ответа API:', response);
  return [];
}

// Получение треков конкретной подборки
export async function getCompilationTracks(
  compilationId: number
): Promise<Track[]> {
  const response = await fetchAPI<CompilationResponse>(
    `/catalog/selection/${compilationId}/`
  );
  return response.tracks;
}

// Получение всех подборок (для фильтров и навигации)
export async function getCompilations(): Promise<CompilationResponse[]> {
  return fetchAPI<CompilationResponse[]>('/catalog/selection/');
}
