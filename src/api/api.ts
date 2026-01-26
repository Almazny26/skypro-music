const API_BASE_URL = 'https://webdev-music-003b5b991590.herokuapp.com';

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
  return localStorage.getItem('accessToken');
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
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
  localStorage.removeItem('username');
  localStorage.removeItem('userEmail');
  window.dispatchEvent(new Event('localStorageChange'));
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: headers as HeadersInit,
      cache: 'no-store',
    });
  } catch (networkError) {
    throw new Error(
      'Не удалось подключиться к серверу. Проверьте подключение к интернету.',
    );
  }

  if (!response.ok) {
    let errorMessage = `Ошибка: ${response.status}`;

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
        if (text && text.trim()) {
          errorMessage = text;
        }
        throw new Error(errorMessage);
      }

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
    } catch (parseError) {
    }
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  } else {
    return (await response.text()) as T;
  }
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const email = credentials.email || credentials.username || '';

  const requestData = {
    email: email,
    password: credentials.password,
  };

  return fetchAPI<AuthResponse>('/user/login/', {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
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

export async function getTracks(): Promise<Track[]> {
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
