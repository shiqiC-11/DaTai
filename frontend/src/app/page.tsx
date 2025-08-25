'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import '@authing/guard-react18/dist/esm/guard.min.css';
import { guard } from '../lib/authing-guard';
import { useAuthStore } from '../stores/auth-store';

export default function Home() {
  const router = useRouter();
  const { setUser, isAuthenticated } = useAuthStore();

  const guardEffects = async () => {
    guard
      .start(document.querySelector('#authing-guard-container') as HTMLElement)
      .then((userInfo: any) => {
        console.log('start userInfo: ', userInfo);
        if (userInfo) {
          handleLoginSuccess(userInfo);
        }
      });

    guard.on('load', (e: any) => {
      console.log('加载啊', e);
    });

    guard.on('login', (userInfo: any) => {
      console.log('userInfo: ', userInfo);
      handleLoginSuccess(userInfo);
    });
  };

  const handleLoginSuccess = (userInfo: any) => {
    // 转换用户信息格式
    const user = {
      uid: userInfo.id || userInfo.uid,
      nickname: userInfo.nickname || userInfo.username,
      email: userInfo.email,
      createdAt: userInfo.createdAt || new Date().toISOString(),
      ...userInfo
    };
    
    // 保存用户信息到store
    setUser(user);
    
    // 跳转到dashboard
    router.push('/dashboard');
  };

  useEffect(() => {
    // 如果已经登录，直接跳转到dashboard
    if (isAuthenticated) {
      router.push('/dashboard');
      return;
    }
    
    guardEffects();
  }, [isAuthenticated, router]);

  // 如果正在检查认证状态，显示加载
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">DaTai</h1>
          <p className="text-gray-600 mt-2">Welcome back! Please sign in to your account.</p>
        </div>
        
        <div id="authing-guard-container"></div>
      </div>
    </div>
  );
}
