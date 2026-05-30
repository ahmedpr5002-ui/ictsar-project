import React, { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from "jwt-decode";

// 1. إنشاء الـ Context
export const AuthContext = createContext(null);

// 2. مزود الخدمة (Provider) لكل التطبيق
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // يمنع وميض الصفحة أثناء التحقق من التوكن

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                // فك التشفير داخل try catch لحماية التطبيق من الانهيار إذا كان التوكن تالفاً
                const decoded = jwtDecode(token);
                setUser(decoded);
            } catch (error) {
                console.error("التوكن المخزن غير صالح:", error);
                localStorage.removeItem('token'); // تنظيف التوكن الفاسد
            }
        }
        setLoading(false); // انتهى التحقق
    }, []);

    const login = (token) => {
        try {
            localStorage.setItem('token', token);
            const decoded = jwtDecode(token);
            setUser(decoded);
        } catch (error) {
            console.error("فشل في فك تشفير توكن تسجيل الدخول:", error);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('image');
        localStorage.removeItem('id');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
           
            {!loading && children}
        </AuthContext.Provider>
    );
};


export const useAuth = () => useContext(AuthContext);