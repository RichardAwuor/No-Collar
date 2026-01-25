
import Constants from 'expo-constants';

// Get backend URL from app.json configuration
export const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

console.log('Backend URL configured:', BACKEND_URL);

/**
 * Helper function to make API calls with proper error handling
 */
export async function apiCall<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BACKEND_URL}${endpoint}`;
  
  console.log(`API Call: ${options?.method || 'GET'} ${url}`);
  if (options?.body) {
    console.log('Request body:', options.body);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    // Get the response text first to see what we're actually receiving
    const responseText = await response.text();
    console.log(`Raw response (${response.status}):`, responseText.substring(0, 200));

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      console.error('Response was:', responseText.substring(0, 500));
      throw new Error(`Server returned invalid JSON. Response: ${responseText.substring(0, 100)}`);
    }
    
    console.log(`API Response (${response.status}):`, data);

    if (!response.ok) {
      throw new Error(data.error || `API request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    throw error;
  }
}
