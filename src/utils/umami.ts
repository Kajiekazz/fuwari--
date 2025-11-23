// src/utils/umami.ts

interface UmamiShareData {
  token: string;
}

const CACHE_KEY = 'umami_share_token';

export function clearUmamiShareCache() {
  localStorage.removeItem(CACHE_KEY);
}

export async function getUmamiShareData(baseUrl: string, shareId: string): Promise<UmamiShareData> {
  // 1. 尝试从缓存读取 Token
  const cachedToken = localStorage.getItem(CACHE_KEY);
  if (cachedToken) {
    return { token: cachedToken };
  }

  // 2. 如果没有缓存，请求 share 接口获取 token
  try {
    // 关键修改：Umami Cloud 需要加上 /analytics/eu
    const response = await fetch(`${baseUrl}/analytics/eu/api/share/${shareId}`);
    
    if (!response.ok) {
      // 兼容性尝试：如果带 /analytics/eu 失败，尝试标准路径（防止未来变动）
      const fallbackResponse = await fetch(`${baseUrl}/api/share/${shareId}`);
      if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          if (data.token) {
              localStorage.setItem(CACHE_KEY, data.token);
              return { token: data.token };
          }
      }
      console.error('Umami Share API Error:', response.status, response.statusText);
      throw new Error('Failed to fetch share data');
    }
    
    const data = await response.json();
    const token = data.token;

    if (!token) {
        throw new Error('No token found in response');
    }

    // 3. 存入缓存
    localStorage.setItem(CACHE_KEY, token);
    return { token };
  } catch (error) {
    console.error('Umami share data fetch error:', error);
    throw error;
  }
}