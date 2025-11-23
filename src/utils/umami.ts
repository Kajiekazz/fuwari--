// src/utils/umami.ts

interface UmamiShareData {
  websiteId: string;
  token: string;
}

const CACHE_KEY = 'umami_share_data';

export function clearUmamiShareCache() {
  localStorage.removeItem(CACHE_KEY);
}

export async function getUmamiShareData(baseUrl: string, shareId: string): Promise<UmamiShareData> {
  // 1. 尝试从缓存读取
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const data = JSON.parse(cached);
    // 简单检查是否过期（可选，这里假设 token 长期有效或依赖 401 重试机制）
    if (data.websiteId && data.token) {
      return data;
    }
  }

  // 2. 如果没有缓存，请求 share 接口获取 token 和 websiteId
  try {
    const response = await fetch(`${baseUrl}/api/share/${shareId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch share data');
    }
    
    const data = await response.json();
    const result = {
      websiteId: data.websiteId,
      token: data.token,
    };

    // 3. 存入缓存
    localStorage.setItem(CACHE_KEY, JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('Umami share data fetch error:', error);
    throw error;
  }
}