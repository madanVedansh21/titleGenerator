
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { AuthCard } from "@/components/auth/AuthCard";
import { Lightbulb } from "lucide-react";

const AuthPage = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && !loading) {
      setLocation('/');
    }
  }, [user, loading, setLocation]);

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Lightbulb className="h-12 w-12 text-purple-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full">
              <Lightbulb className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Content Ideas
            </h1>
          </div>
          <p className="text-gray-600">
            Your AI-powered content strategy assistant
          </p>
        </div>
        <AuthCard mode={mode} onToggleMode={toggleMode} />
      </div>
    </div>
  );
};

export default AuthPage;
