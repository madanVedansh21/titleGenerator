import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Lightbulb, TrendingUp, Sparkles, Loader2, User, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/auth/UserMenu";
import { AuthCard } from "@/components/auth/AuthCard";

interface ContentIdea {
  title: string;
  format: string;
  angle: string;
}

const Index = () => {
  const { user } = useAuth();
  const [mainKeyword, setMainKeyword] = useState("");
  const [trendingKeywords, setTrendingKeywords] = useState("");
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const formatBadgeColor = (format: string) => {
    const colors = {
      'Blog': 'bg-blue-100 text-blue-800',
      'Video': 'bg-red-100 text-red-800',
      'Twitter Thread': 'bg-cyan-100 text-cyan-800',
      'Reel': 'bg-pink-100 text-pink-800',
      'Carousel': 'bg-green-100 text-green-800',
      'Post': 'bg-purple-100 text-purple-800',
      'Story': 'bg-orange-100 text-orange-800',
      'Podcast': 'bg-indigo-100 text-indigo-800',
    };
    return colors[format as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const generateContentIdeas = async () => {
    if (!mainKeyword.trim()) {
      toast.error("Please enter a main keyword");
      return;
    }

    setIsLoading(true);
    
    try {
      const headers: any = {
        'Content-Type': 'application/json'
      };

      // Add authorization header if user is logged in
      if (user) {
        const token = localStorage.getItem('authToken');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mainKeyword,
          trendingKeywords
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 429 && errorData.requiresAuth) {
          toast.error("Daily limit reached! Sign up or log in to generate more ideas.");
          setShowAuthDialog(true);
          setAuthMode('signup');
          return;
        }
        
        console.error('API Error:', errorData);
        throw new Error(errorData.error || `API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Parse the response
      const ideas = parseContentIdeas(data.content);
      setContentIdeas(ideas);
      
      if (ideas.length > 0) {
        toast.success("Content ideas generated successfully!");
      } else {
        toast.error("Could not parse the generated content. Please try again.");
      }
      
    } catch (error) {
      console.error('Error generating content ideas:', error);
      toast.error("Failed to generate content ideas. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const parseContentIdeas = (text: string): ContentIdea[] => {
    const ideas: ContentIdea[] = [];
    const sections = text.split('---').filter(section => section.trim());
    
    sections.forEach(section => {
      const lines = section.split('\n').filter(line => line.trim());
      let title = '';
      let format = '';
      let angle = '';
      
      lines.forEach(line => {
        if (line.toLowerCase().includes('title:')) {
          title = line.replace(/title:/i, '').trim();
        } else if (line.toLowerCase().includes('format:')) {
          format = line.replace(/format:/i, '').trim();
        } else if (line.toLowerCase().includes('angle:')) {
          angle = line.replace(/angle:/i, '').trim();
        }
      });
      
      if (title && format && angle) {
        ideas.push({ title, format, angle });
      }
    });
    
    return ideas.slice(0, 5); // Ensure we only return 5 ideas
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 relative">
          {/* User Menu and Auth Button in top right */}
          <div className="absolute top-0 right-0 flex items-center gap-2">
            {user ? (
              <UserMenu />
            ) : (
              <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Sign In
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
                    </DialogTitle>
                  </DialogHeader>
                  <AuthCard 
                    mode={authMode} 
                    onToggleMode={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full">
              <Lightbulb className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Content Strategy Assistant
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Generate creative, trend-aware content ideas that drive engagement and capture your audience's attention
          </p>
          {!user && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Lock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                Free users get 2 generations per day. Sign up for unlimited access!
              </span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <Card className="max-w-2xl mx-auto mb-12 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              Generate Content Ideas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Main Keyword *
              </label>
              <Input
                placeholder="e.g., fitness, productivity, marketing..."
                value={mainKeyword}
                onChange={(e) => setMainKeyword(e.target.value)}
                className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Trending Keywords (Optional)
              </label>
              <Textarea
                placeholder="Enter trending terms separated by commas (e.g., HIIT workouts, protein snacks, celebrity fitness)"
                value={trendingKeywords}
                onChange={(e) => setTrendingKeywords(e.target.value)}
                className="border-gray-200 focus:border-purple-500 focus:ring-purple-500 min-h-[100px]"
              />
            </div>

            <Button
              onClick={generateContentIdeas}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating Ideas...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Content Ideas
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Content Ideas Display */}
        {contentIdeas.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
              Your Content Ideas
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
              {contentIdeas.map((idea, index) => (
                <Card
                  key={index}
                  className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2 leading-tight">
                          {idea.title}
                        </h3>
                        <Badge className={`${formatBadgeColor(idea.format)} font-medium`}>
                          {idea.format}
                        </Badge>
                      </div>
                      <div className="ml-4 p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full">
                        <span className="text-2xl font-bold text-purple-600">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-600 mb-1">Angle:</p>
                      <p className="text-gray-700 leading-relaxed">{idea.angle}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {contentIdeas.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="p-4 bg-white/60 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <Lightbulb className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Ready to Generate Ideas
            </h3>
            <p className="text-gray-500">
              Enter your main keyword and optional trending terms to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
