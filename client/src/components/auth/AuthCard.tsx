
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail, Lock, User, Chrome } from "lucide-react";

interface AuthCardProps {
  mode: 'signin' | 'signup';
  onToggleMode: () => void;
}

export const AuthCard = ({ mode, onToggleMode }: AuthCardProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (mode === 'signin') {
      await signIn(email, password);
    } else {
      await signUp(email, password, fullName);
    }

    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    await signInWithGoogle();
    setIsGoogleLoading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="text-center space-y-1">
        <CardTitle className="text-2xl font-bold text-gray-800">
          {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
        </CardTitle>
        <p className="text-sm text-gray-600">
          {mode === 'signin' 
            ? 'Sign in to access your content ideas' 
            : 'Join us to start creating amazing content'
          }
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 border-gray-200 hover:bg-gray-50"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Chrome className="h-5 w-5 mr-2 text-blue-600" />
          )}
          Continue with Google
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              mode === 'signin' ? 'Sign In' : 'Create Account'
            )}
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-gray-600">
            {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            type="button"
            onClick={onToggleMode}
            className="text-purple-600 hover:text-purple-700 font-medium hover:underline"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
