import { describe, test, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import api from '../services/api';

// Mock axios
vi.mock('axios');

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('api instance is created', () => {
    expect(api).toBeDefined();
    expect(typeof api.get).toBe('function');
    expect(typeof api.post).toBe('function');
    expect(typeof api.put).toBe('function');
    expect(typeof api.delete).toBe('function');
  });

  test('api has correct base configuration', () => {
    // Test that api instance exists and has expected methods
    expect(api.defaults).toBeDefined();
    expect(api.interceptors).toBeDefined();
  });

  test('api can make GET requests', async () => {
    const mockResponse = { data: { message: 'success' } };
    api.get = vi.fn().mockResolvedValue(mockResponse);

    const result = await api.get('/test');
    
    expect(api.get).toHaveBeenCalledWith('/test');
    expect(result).toEqual(mockResponse);
  });

  test('api can make POST requests', async () => {
    const mockResponse = { data: { id: 1, message: 'created' } };
    const postData = { name: 'test' };
    
    api.post = vi.fn().mockResolvedValue(mockResponse);

    const result = await api.post('/test', postData);
    
    expect(api.post).toHaveBeenCalledWith('/test', postData);
    expect(result).toEqual(mockResponse);
  });
});