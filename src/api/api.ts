// Используем прокси для обхода CORS проблем
// В development используем локальный прокси, в production можно использовать прямой URL
const API_BASE_URL = typeof window !== 'undefined' 
  ? '/api/proxy'  // Используем Next.js API route как прокси
  : 'https://webdev-music-003b5b991590.herokuapp.com'; // На сервере используем прямой URL

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
  access?: string;
  refresh?: string;
  username?: string;
  email?: string;
  _id?: number;
  token?: string;
  accessToken?: string;
  // Сервер может возвращать токен в разных полях
  [key: string]: any;
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
  [key: string]: boolean | Track[] | undefined;
}

export interface CompilationResponse {
  id: number;
  name: string;
  owner: string;
  tracks: Track[];
  items?: number[];
}

interface CompilationAPIResponse {
  _id?: number;
  id?: number;
  name?: string;
  owner?: string | string[];
  tracks?: Track[];
  items?: number[];
  data?: {
    _id?: number;
    id?: number;
    name?: string;
    owner?: string | string[];
    tracks?: Track[];
    items?: number[];
  } | null;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('accessToken');
  
  // Проверяем, что токен не является строкой "undefined" или "null"
  if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
    return null;
  }
  
  return token;
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  
  // Проверяем, что токен валидный
  if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
    return;
  }
  
  localStorage.setItem('accessToken', token);
  window.dispatchEvent(new Event('localStorageChange'));
}

export function setUserInfo(username: string, email: string): void {
  if (typeof window === 'undefined') return;

  if (
    username &&
    username !== 'undefined' &&
    username !== 'null' &&
    username.trim() !== ''
  ) {
    const trimmedUsername = username.trim();
    localStorage.setItem('username', trimmedUsername);
    window.dispatchEvent(new Event('localStorageChange'));
  }
  if (
    email &&
    email !== 'undefined' &&
    email !== 'null' &&
    email.trim() !== ''
  ) {
    localStorage.setItem('userEmail', email.trim());
  }
}

export function getUsername(): string | null {
  if (typeof window === 'undefined') return null;
  const username = localStorage.getItem('username');
  if (username === 'undefined' || username === 'null' || !username) {
    return null;
  }
  return username;
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('username');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userId');
  refreshTokenPromise = null; // Сбрасываем Promise обновления токена
  window.dispatchEvent(new Event('localStorageChange'));
}

// Получить refresh токен
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken || refreshToken === 'undefined' || refreshToken === 'null' || refreshToken.trim() === '') {
    return null;
  }
  return refreshToken;
}

// Сохранить refresh токен
export function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
    return;
  }
  localStorage.setItem('refreshToken', token);
}

// Обновление токена через refresh token (вызов без Authorization, чтобы не слать протухший access)
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  const requestUrl = API_BASE_URL.startsWith('/api/proxy')
    ? `${API_BASE_URL}/user/token/refresh/`
    : `https://webdev-music-003b5b991590.herokuapp.com/user/token/refresh/`;

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
      credentials: API_BASE_URL.startsWith('/api/proxy') ? 'include' : 'same-origin',
    });

    if (!response.ok) {
      removeToken();
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.access || data.token || data.accessToken;
    if (newAccessToken) {
      setToken(newAccessToken);
      if (data.refresh) {
        setRefreshToken(data.refresh);
      }
      return newAccessToken;
    }
    return null;
  } catch (error) {
    removeToken();
    return null;
  }
}

// Глобальный флаг и Promise для синхронизации обновления токена
let refreshTokenPromise: Promise<string | null> | null = null;

// Обертка для функций API с автоматическим обновлением токена при 401
export function withReAuth<T extends (...args: any[]) => Promise<any>>(
  apiFunction: T
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await apiFunction(...args);
    } catch (error: any) {
      // Проверяем, является ли ошибка 401
      if (error?.message?.includes('401') || 
          error?.message?.includes('токен') || 
          error?.message?.includes('Токен') ||
          error?.message?.includes('недействителен')) {
        
        // Если уже идет обновление токена, ждем его завершения
        if (refreshTokenPromise) {
          const newToken = await refreshTokenPromise;
          if (newToken) {
            // Повторяем запрос с новым токеном
            try {
              return await apiFunction(...args);
            } catch (retryError) {
              throw retryError;
            }
          } else {
            throw error;
          }
        } else {
          // Начинаем обновление токена
          refreshTokenPromise = refreshAccessToken();
          const newToken = await refreshTokenPromise;
          refreshTokenPromise = null;
          
          if (newToken) {
            // Повторяем запрос с новым токеном
            try {
              return await apiFunction(...args);
            } catch (retryError) {
              throw retryError;
            }
          } else {
            // Если обновление токена не удалось, пробрасываем ошибку
            throw error;
          }
        }
      } else {
        // Для других ошибок просто пробрасываем
        throw error;
      }
    }
  }) as T;
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  
  // Добавляем Content-Type только если есть body
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  // Для авторизованных запросов передаём только Bearer токен (по документации API)
  if (token && token.trim() !== '') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  
  // Не используем credentials: 'include' из-за CORS проблем
  // Сервер возвращает Access-Control-Allow-Origin: *, что несовместимо с credentials
  
  // Создаем AbortController для таймаута
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 30000); // 30 секунд таймаут
  
  // Формируем URL для запроса
  // Если используем прокси, добавляем endpoint к прокси URL
  const requestUrl = API_BASE_URL.startsWith('/api/proxy')
    ? `${API_BASE_URL}${endpoint}`
    : `${API_BASE_URL}${endpoint}`;
  
  try {
    const startTime = Date.now();
    response = await fetch(requestUrl, {
      ...options,
      headers: headers as HeadersInit,
      cache: 'no-store',
      signal: controller.signal,
      // При использовании прокси можем использовать credentials для передачи cookies
      credentials: API_BASE_URL.startsWith('/api/proxy') ? 'include' : 'same-origin',
    });
    clearTimeout(timeoutId);
  } catch (networkError) {
    clearTimeout(timeoutId);
    
    if (networkError instanceof Error && networkError.name === 'AbortError') {
      const errorMessage = 'Превышено время ожидания ответа от сервера (30 секунд). Сервер не отвечает. Возможно, проблема на стороне сервера или требуется VPN.';
      throw new Error(errorMessage);
    }
    
    // Более детальное сообщение об ошибке
    let errorMessage = 'Не удалось подключиться к серверу. ';
    if (networkError instanceof TypeError) {
      if (networkError.message.includes('Failed to fetch') || networkError.message.includes('NetworkError')) {
        errorMessage += 'Сервер недоступен или не отвечает. Проверьте: 1) VPN включен, 2) Сервер доступен, 3) Нет проблем с сетью.';
      } else {
        errorMessage += `Ошибка сети: ${networkError.message}`;
      }
    } else if (networkError instanceof Error) {
      errorMessage += networkError.message;
    } else {
      errorMessage += 'Неизвестная ошибка сети.';
    }
    
    throw new Error(errorMessage);
  }

  if (!response.ok) {
    let errorMessage = `Ошибка: ${response.status}`;

    // Читаем ответ один раз
    let text = '';
    let errorData: any = null;
    
    try {
      text = await response.text();
      if (text && text.trim()) {
        try {
          errorData = JSON.parse(text);
        } catch {
          // Если не JSON, используем текст как есть
          errorData = { detail: text };
        }
      }
    } catch (parseError) {
      // Если не удалось прочитать ответ
    }

    // Обработка специфичных статусов
    if (response.status === 401) {
      if (errorData?.detail) {
        errorMessage = errorData.detail;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (text && text.trim()) {
        errorMessage = text;
      } else {
        errorMessage = 'Токен недействителен или истек. Пожалуйста, войдите заново.';
      }
    } else if (response.status === 403) {
      errorMessage = errorData?.detail || errorData?.message || 'Доступ запрещен';
    } else if (response.status === 404) {
      errorMessage = errorData?.detail || errorData?.message || 'Ресурс не найден';
    } else if (response.status === 500) {
      errorMessage = errorData?.detail || errorData?.message || 'Ошибка сервера. Попробуйте позже';
    } else if (response.status === 503) {
      errorMessage = errorData?.detail || errorData?.message || 'Сервис временно недоступен. Попробуйте позже';
    } else {
      // Для других ошибок пытаемся извлечь сообщение из errorData
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.data?.errors) {
          const errors = errorData.data.errors;
          const errorMessages: string[] = [];
          for (const [field, messages] of Object.entries(errors)) {
            if (Array.isArray(messages) && messages.length > 0) {
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
          const keys = Object.keys(errorData);
          if (keys.length > 0) {
            const firstKey = keys[0];
            const firstValue = errorData[firstKey];
            if (Array.isArray(firstValue) && firstValue.length > 0) {
              errorMessage = String(firstValue[0]);
            } else if (typeof firstValue === 'string') {
              errorMessage = firstValue;
            } else {
              errorMessage = `Ошибка в поле "${firstKey}": ${JSON.stringify(
                firstValue,
              )}`;
            }
          } else {
            errorMessage = JSON.stringify(errorData);
          }
        }
      }
    }
    
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get('content-type');
  let data: any;
  
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  
  return data as T;
}

// Получить пару access и refresh токенов (эндпоинт /user/token/ по документации API)
async function getTokens(email: string, password: string): Promise<{ access: string; refresh: string } | null> {
  try {
    const response = await fetchAPI<AuthResponse>('/user/token/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const access = response.access || response.token || response.accessToken;
    const refresh = response.refresh || response.refreshToken || response.refresh_token || '';
    if (access && refresh) {
      return { access, refresh };
    }
    return null;
  } catch {
    return null;
  }
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const email = credentials.email || credentials.username || '';

  // 1. Вход — проверка учётных данных и получение данных пользователя (токенов /user/login/ не возвращает)
  const loginResponse = await fetchAPI<any>('/user/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password: credentials.password }),
  });

  const username = loginResponse.username || '';
  const userId = loginResponse._id || loginResponse.id;

  if (userId && typeof window !== 'undefined') {
    localStorage.setItem('userId', String(userId));
  }

  // 2. Получение JWT токенов через эндпоинт /user/token/
  const tokens = await getTokens(email, credentials.password);
  if (!tokens) {
    return {
      access: '',
      refresh: '',
      username,
      email: loginResponse.email || email,
    };
  }

  if (typeof window !== 'undefined') {
    setToken(tokens.access);
    setRefreshToken(tokens.refresh);
  }

  return {
    access: tokens.access,
    refresh: tokens.refresh,
    username,
    email: loginResponse.email || email,
  };
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  let username: string;
  if (data.email.includes('@')) {
    username = data.email.split('@')[0];
  } else {
    username = data.email;
  }

  // 1. Регистрация (токенов /user/signup/ не возвращает)
  const signupResponse = await fetchAPI<any>('/user/signup/', {
    method: 'POST',
    body: JSON.stringify({ username, email: data.email, password: data.password }),
  });

  const result = signupResponse.result || signupResponse;
  const userId = result._id || result.id || signupResponse._id || signupResponse.id;

  if (userId && typeof window !== 'undefined') {
    localStorage.setItem('userId', String(userId));
  }

  // 2. Получение JWT токенов через эндпоинт /user/token/
  const tokens = await getTokens(data.email, data.password);
  if (!tokens) {
    return {
      access: '',
      refresh: '',
      username: result.username || username,
      email: result.email || data.email,
    };
  }

  if (typeof window !== 'undefined') {
    setToken(tokens.access);
    setRefreshToken(tokens.refresh);
  }

  return {
    access: tokens.access,
    refresh: tokens.refresh,
    username: result.username || username,
    email: result.email || data.email,
  };
}

export async function getTracks(): Promise<Track[]> {
  try {
    const response = await fetchAPI<TracksResponse>('/catalog/track/all/');

    if (Array.isArray(response)) {
      return response;
    }

    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }

    if (response.items && Array.isArray(response.items)) {
      return response.items;
    }

    return [];
  } catch (error) {
    throw error;
  }
}

export async function getCompilationTracks(
  compilationId: number,
): Promise<Track[]> {
  const response = await fetchAPI<CompilationResponse>(
    `/catalog/selection/${compilationId}/`,
  );
  return response.tracks || [];
}

export async function getCompilation(
  compilationId: number,
): Promise<CompilationResponse> {
  const response = await fetchAPI<CompilationAPIResponse>(`/catalog/selection/${compilationId}/`);

  if (response && typeof response === 'object') {
    if (response.name !== undefined && response.tracks !== undefined) {
      return response as CompilationResponse;
    }

    if (response.data !== undefined) {
      if (response.data === null) {
        return {
          id: compilationId,
          name: '',
          owner: '',
          tracks: [],
          items: [],
        };
      }

      if (response.data && typeof response.data === 'object') {
        let tracks: Track[] = [];

        if (response.data.tracks && Array.isArray(response.data.tracks)) {
          tracks = response.data.tracks;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          tracks = [];
        }

        return {
          id: response.data._id || response.data.id || compilationId,
          name: response.data.name || '',
          owner: Array.isArray(response.data.owner) 
            ? response.data.owner.join(', ') 
            : response.data.owner || '',
          tracks: tracks,
          items: response.data.items || [],
        };
      }
    }

    if (Array.isArray(response)) {
      return {
        id: compilationId,
        name: `Подборка ${compilationId}`,
        owner: '',
        tracks: response,
        items: [],
      };
    }
  }

  return {
    id: compilationId,
    name: '',
    owner: '',
    tracks: [],
    items: [],
  };
}

export async function getCompilations(): Promise<CompilationResponse[]> {
  return fetchAPI<CompilationResponse[]>('/catalog/selection/');
}

// Добавить трек в избранное (Authorization: Bearer access, по документации API)
export const addTrackToFavorites = withReAuth(async function addTrackToFavorites(trackId: number): Promise<void> {
  const token = getToken();
  if (!token || token.trim() === '') {
    throw new Error('Необходимо войти в систему.');
  }

  try {
    await fetchAPI<void>(`/catalog/track/${trackId}/favorite/`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Не удалось добавить трек в избранное';
    if (errorMessage.includes('401') || errorMessage.includes('токен') || errorMessage.includes('Токен')) {
      throw new Error('Токен недействителен или истек. Пожалуйста, войдите заново.');
    }
    if (errorMessage.includes('403') || errorMessage.includes('запрещен')) {
      throw new Error('Доступ запрещен. Убедитесь, что вы авторизованы.');
    }
    if (errorMessage.includes('404')) {
      throw new Error('Трек не найден.');
    }
    if (errorMessage.includes('500') || errorMessage.includes('сервер')) {
      throw new Error('Ошибка сервера. Попробуйте позже.');
    }
    throw new Error(errorMessage);
  }
});

// Удалить трек из избранного (Authorization: Bearer access, по документации API)
export const removeTrackFromFavorites = withReAuth(async function removeTrackFromFavorites(trackId: number): Promise<void> {
  const token = getToken();
  if (!token || token.trim() === '') {
    throw new Error('Необходимо войти в систему.');
  }

  try {
    await fetchAPI<void>(`/catalog/track/${trackId}/favorite/`, {
      method: 'DELETE',
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Не удалось удалить трек из избранного';
    if (errorMessage.includes('401') || errorMessage.includes('токен') || errorMessage.includes('Токен')) {
      throw new Error('Токен недействителен или истек. Пожалуйста, войдите заново.');
    }
    if (errorMessage.includes('403') || errorMessage.includes('запрещен')) {
      throw new Error('Доступ запрещен. Убедитесь, что вы авторизованы.');
    }
    if (errorMessage.includes('404')) {
      throw new Error('Трек не найден.');
    }
    if (errorMessage.includes('500') || errorMessage.includes('сервер')) {
      throw new Error('Ошибка сервера. Попробуйте позже.');
    }
    throw new Error(errorMessage);
  }
});

// Получить избранные треки пользователя (GET /catalog/track/favorite/all/ по документации API)
export const getFavoriteTracks = withReAuth(async function getFavoriteTracks(): Promise<Track[]> {
  const token = getToken();
  if (!token || token.trim() === '') {
    return [];
  }
  try {
    const response = await fetchAPI<TracksResponse | Track[]>('/catalog/track/favorite/all/');
    if (Array.isArray(response)) {
      return response;
    }
    const data = response as TracksResponse;
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }
    if (data.items && Array.isArray(data.items)) {
      return data.items;
    }
    return [];
  } catch (err) {
    return [];
  }
});

// Получить ID текущего пользователя (если доступно)
export function getCurrentUserId(): number | null {
  // Обычно ID пользователя хранится в токене или отдельно
  // Для упрощения, можно получить из API или хранить в localStorage
  if (typeof window === 'undefined') return null;
  const userId = localStorage.getItem('userId');
  return userId ? parseInt(userId, 10) : null;
}
