import CyberGrid from '@/components/CyberGrid';
import CyberNav from '@/components/CyberNav';

interface PlaceholderPageProps {
  title: string;
  description: string;
  comingSoon?: boolean;
}

export default function PlaceholderPage({ 
  title, 
  description, 
  comingSoon = true 
}: PlaceholderPageProps) {
  return (
    <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
      <CyberGrid intensity="low" animated={true} />
      <CyberNav />
      
      <div className="relative z-10 pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Terminal header */}
          <div className="terminal mb-8 inline-block">
            <span className="text-cyber-green font-mono text-sm">
              Accessing {title.toLowerCase()} module...
            </span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-cyber font-black text-cyber-green mb-6 neon-glow">
            {title}
          </h1>
          
          <p className="text-xl text-gray-300 font-mono mb-12 max-w-2xl mx-auto">
            {description}
          </p>

          {comingSoon && (
            <div className="space-y-8">
              {/* Coming Soon Animation */}
              <div className="relative">
                <div className="text-6xl lg:text-8xl font-cyber font-black text-cyber-orange/20 mb-4">
                  <span className="glitch" data-text="COMING SOON">COMING SOON</span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-1 bg-gradient-to-r from-transparent via-cyber-green to-transparent animate-cyber-scan"></div>
                </div>
              </div>

              {/* Progress indicators */}
              <div className="grid md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-cyber-green rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse-glow">
                    <div className="w-6 h-6 bg-cyber-green rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-cyber-green font-mono text-sm">INITIALIZING</span>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-cyber-blue/50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <div className="w-6 h-6 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <span className="text-cyber-blue/50 font-mono text-sm">PROCESSING</span>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <div className="w-6 h-6 bg-gray-600 rounded-full opacity-30"></div>
                  </div>
                  <span className="text-gray-600 font-mono text-sm">PENDING</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-400 font-mono text-sm mb-4">
                  This module is currently under development.
                </p>
                <button className="px-6 py-3 border border-cyber-green/30 text-cyber-green font-mono hover:bg-cyber-green/10 transition-all duration-300">
                  NOTIFY ON COMPLETION
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
