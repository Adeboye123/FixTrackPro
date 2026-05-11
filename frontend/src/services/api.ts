const API_URL = import.meta.env.VITE_API_URL || '/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
};

const handleResponse = async (res: Response) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        throw new Error(data.error || 'API Error');
    }
    return data;
};

export const api = {
    auth: {
        login: async (data: any) => {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        },
        register: async (data: any) => {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        },
        verifyOTP: async (data: any) => {
            const res = await fetch(`${API_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        },
        forgotPassword: async (email: string) => {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ email })
            });
            return handleResponse(res);
        },
        resetPassword: async (data: any) => {
            const res = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        },
        resendOTP: async (data: { email: string }) => {
            const res = await fetch(`${API_URL}/auth/resend-otp`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        }
    },
    staff: {
        list: async () => {
             const res = await fetch(`${API_URL}/staff`, { headers: getHeaders() });
             return handleResponse(res);
        },
        create: async (data: any) => {
            const res = await fetch(`${API_URL}/staff`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        },
        updateRanking: async (id: string, ranking: string) => {
            const res = await fetch(`${API_URL}/staff/${id}/ranking`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ ranking })
            });
            return handleResponse(res);
        },
        delete: async (id: string) => {
            const res = await fetch(`${API_URL}/staff/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return handleResponse(res);
        }
    },
    shop: {
        getMe: async () => {
            const res = await fetch(`${API_URL}/shop/me`, { headers: getHeaders() });
            return handleResponse(res);
        },
        updateProfile: async (data: any) => {
            const res = await fetch(`${API_URL}/shop/profile`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        },
        updatePassword: async (data: any) => {
            const res = await fetch(`${API_URL}/shop/password`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        },
        subscribe: async (data: any) => {
            const res = await fetch(`${API_URL}/shop/subscribe`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        },
        uploadLogo: async (file: File) => {
            const formData = new FormData();
            formData.append('logo', file);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/shop/logo`, {
                method: 'POST',
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: formData
            });
            return handleResponse(res);
        },
        deleteLogo: async () => {
            const res = await fetch(`${API_URL}/shop/logo`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return handleResponse(res);
        }
    },
    repairs: {
        list: async () => {
             const res = await fetch(`${API_URL}/repairs`, { headers: getHeaders() });
             return handleResponse(res);
        },
        create: async (data: any) => {
            const res = await fetch(`${API_URL}/repairs`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        },
        update: async (id: string, data: any) => {
             const res = await fetch(`${API_URL}/repairs/${id}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        },
        notify: async (id: string, type: string) => {
             const res = await fetch(`${API_URL}/repairs/${id}/notify`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ type })
            });
            return handleResponse(res);
        }
    },
    inventory: {
        list: async () => {
             const res = await fetch(`${API_URL}/inventory`, { headers: getHeaders() });
             return handleResponse(res);
        },
        create: async (data: any) => {
             const res = await fetch(`${API_URL}/inventory`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        }
    },
    dashboard: {
        stats: async () => {
             const res = await fetch(`${API_URL}/dashboard/stats`, { headers: getHeaders() });
             return handleResponse(res);
        }
    },
    admin: {
        stats: async () => {
             const res = await fetch(`${API_URL}/admin/stats`, { headers: getHeaders() });
             return handleResponse(res);
        },
        updatePlan: async (shopId: string, plan: string) => {
             const res = await fetch(`${API_URL}/admin/shops/${shopId}/plan`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ plan })
            });
            return handleResponse(res);
        },
        getSettings: async () => {
            const res = await fetch(`${API_URL}/admin/settings`, { headers: getHeaders() });
            return handleResponse(res);
        },
        updatePricing: async (pricing: { basic: number; pro: number; premium: number }) => {
            const res = await fetch(`${API_URL}/admin/settings/pricing`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(pricing)
            });
            return handleResponse(res);
        },
        syncPaystack: async () => {
            const res = await fetch(`${API_URL}/admin/sync-paystack`, {
                method: 'POST',
                headers: getHeaders()
            });
            return handleResponse(res);
        },
        getPricing: async () => {
            const res = await fetch(`${API_URL}/admin/pricing`);
            return handleResponse(res);
        },
        getPublicStats: async () => {
            const res = await fetch(`${API_URL}/admin/public-stats`);
            return handleResponse(res);
        },
        getSecurityLogs: async () => {
            const res = await fetch(`${API_URL}/admin/security-logs`, { headers: getHeaders() });
            return handleResponse(res);
        }
    }
};
