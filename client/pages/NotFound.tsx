import { Link } from 'react-router-dom';
import CyberGrid from '@/components/CyberGrid';
import CyberNav from '@/components/CyberNav';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
      <CyberGrid intensity="high" animated={true} />
      <CyberNav />
      
      <div className="relative z-10 pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Terminal error */}
          <div className="terminal mb-8 inline-block">
            <span className="text-destructive font-mono text-sm">
              ERROR: Access denied - Resource not found
            </span>
          </div>

          <div className="space-y-8">
            {/* 404 with glitch effect */}
            <h1 className="text-8xl lg:text-9xl font-cyber font-black text-destructive mb-6">
              <span className="glitch neon-glow" data-text="404">404</span>
            </h1>

            <h2 className="text-2xl lg:text-3xl font-cyber text-cyber-orange mb-6">
              SECTOR NOT FOUND
            </h2>
            
            <p className="text-lg text-gray-300 font-mono mb-12 max-w-2xl mx-auto">
              The requested resource has been moved, deleted, or never existed in the network.
              Please verify the path and try again.
            </p>

            {/* Navigation options */}
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <Link 
                  to="/"
                  className="group px-6 py-4 border-2 border-cyber-green text-cyber-green font-mono font-bold tracking-wider hover:bg-cyber-green/20 transition-all duration-300 neon-border"
                >
                  <span className="block text-sm opacity-60 mb-1">MAIN</span>
                  <span className="block">TERMINAL</span>
                </Link>
                
                <Link 
                  to="/whitepaper"
                  className="group px-6 py-4 border-2 border-cyber-blue text-cyber-blue font-mono font-bold tracking-wider hover:bg-cyber-blue/20 transition-all duration-300"
                >
                  <span className="block text-sm opacity-60 mb-1">READ</span>
                  <span className="block">DOCS</span>
                </Link>
                
                <Link 
                  to="/contact"
                  className="group px-6 py-4 border-2 border-cyber-orange text-cyber-orange font-mono font-bold tracking-wider hover:bg-cyber-orange/20 transition-all duration-300"
                >
                  <span className="block text-sm opacity-60 mb-1">SECURE</span>
                  <span className="block">CHANNEL</span>
                </Link>
              </div>

              {/* System status */}
              <div className="flex justify-center items-center space-x-4 mt-8">
                <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                <span className="text-destructive font-mono text-sm">ROUTE ERROR</span>
                <div className="w-px h-4 bg-gray-600"></div>
                <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse"></div>
                <span className="text-cyber-green font-mono text-sm">NETWORK OK</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
