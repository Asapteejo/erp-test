// src/api/saasApi.js
import { useClerkAuth } from '../hooks/useClerkAuth';

let authHook = null;
export const setAuthHook = (hook) => { authHook = hook; };

const api = async (endpoint, options = {}) => {
  const { getToken } = authHook?.() || {};
  const token = await getToken?.();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`/api/saas${endpoint}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'API error' }));
    throw new Error(err.error || 'API error');
  }
  return res.json();
};

export const getAnalytics = () => api('/v1/analytics');
export const getSchools = (params) => api('/v1/schools?' + new URLSearchParams(params));
export const getRevenue = () => api('/v1/revenue');