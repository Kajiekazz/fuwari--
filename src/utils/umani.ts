// src/utils/umami.ts

interface UmamiShareData {
  token: string;
}

const CACHE_KEY = 'umami_share_token';

export function clearUmamiShareCache() {
  localStorage.removeItem(CACHE_KEY);
}

export async function getUmamiShareData(baseUrl: string, shareId: string): Promise<UmamiShareData> {
  const cachedToken = localStorage.getItem(CACHE_KEY);
  if (cachedToken) {
    return { token: cachedToken };
  }

  try {
    // 尝试 eu 接口
    const response = await fetch(`${baseUrl}/analytics/eu/api/share/${shareId}`);
    
    if (!response.ok) {
      // 失败则尝试标准接口
      const fallbackResponse = await fetch(`${baseUrl}/api/share/${shareId}`);
      if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          if (data.token) {
              localStorage.setItem(CACHE_KEY, data.token);
              return { token: data.token };
          }
      }
      throw new Error('Failed to fetch share data');
    }
    
    const data = await response.json();
    const token = data.token;

    if (!token) throw new Error('No token found');

    localStorage.setItem(CACHE_KEY, token);
    return { token };
  } catch (error) {
    console.error('Umami share data fetch error:', error);
    throw error;
  }
}