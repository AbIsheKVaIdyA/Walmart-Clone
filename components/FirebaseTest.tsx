"use client";

import { useState } from 'react';
import { FirebaseAuthService } from '@/lib/firebaseAuth';
import { auth, db } from '@/lib/firebase';

export default function FirebaseTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testFirebaseConnection = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      addResult('Testing Firebase connection...');
      
      // Test 1: Check if Firebase is initialized
      if (!auth) {
        addResult('❌ Firebase Auth not initialized');
        return;
      }
      addResult('✅ Firebase Auth initialized');
      
      // Test 2: Check if Firestore is initialized
      if (!db) {
        addResult('❌ Firestore not initialized');
        return;
      }
      addResult('✅ Firestore initialized');
      
      // Test 3: Check Firebase configuration
      const config = auth.config;
      addResult(`✅ Auth Domain: ${config.authDomain}`);
      addResult(`✅ API Key: ${config.apiKey?.substring(0, 10)}...`);
      
      // Test 4: Check current user
      const currentUser = auth.currentUser;
      if (currentUser) {
        addResult(`✅ Current user: ${currentUser.email}`);
      } else {
        addResult('ℹ️ No user currently signed in');
      }
      
      // Test 5: Test authentication with demo credentials
      addResult('Testing authentication with demo credentials...');
      const result = await FirebaseAuthService.signInWithEmail('admin@walmart.com', 'admin123');
      
      if (result.success) {
        addResult('✅ Demo authentication successful');
        addResult(`✅ User: ${result.user?.name} (${result.user?.role})`);
      } else {
        addResult(`❌ Demo authentication failed: ${result.error}`);
      }
      
    } catch (error: any) {
      addResult(`❌ Firebase test error: ${error.message}`);
      console.error('Firebase test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <h3 className="font-bold text-lg mb-2">Firebase Debug</h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={testFirebaseConnection}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Firebase Connection'}
        </button>
        
        <button
          onClick={clearResults}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Clear Results
        </button>
      </div>
      
      <div className="max-h-60 overflow-y-auto">
        {testResults.length === 0 ? (
          <p className="text-gray-500 text-sm">Click &quot;Test Firebase Connection&quot; to start debugging</p>
        ) : (
          <div className="space-y-1">
            {testResults.map((result, index) => (
              <div key={index} className="text-xs font-mono">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
