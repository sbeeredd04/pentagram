"use client";

import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const url = isLogin ? 'http://127.0.0.1:5001/login' : 'http://127.0.0.1:5001/register';
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const data = await response.json(); 
        sessionStorage.setItem('user', JSON.stringify({ username: data.username })); 
        console.log('Session Storage Set:', sessionStorage.getItem('user')); // Debug log
        onClose(); 
        window.location.reload();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'An error occurred. Please try again.');
      }
    } catch (err) {
      setError('Failed to fetch. Please check your network connection and try again.');
      console.error('Fetch error:', err);
    }
  };



  return isOpen ? (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-lg z-50 flex justify-center items-center">
      <div className="bg-black bg-opacity-70 border border-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-lg font-bold text-center text-white">{isLogin ? 'Login' : 'Register'}</h2>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">Username</label>
            <input type="text" id="username" value={username} onChange={e => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 text-white" required />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
            <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 text-white" required />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        <div className="mt-4 flex justify-between">
          <button onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-400 hover:text-indigo-600 text-sm font-medium">
            {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
          </button>
          <button onClick={onClose}
            className="text-red-400 hover:text-red-600 text-sm font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  ) : null;
};