-- Chat Component ---
const ChatPage = ({ userId, isAuthReady, navigate, connectWallet }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatRef = collection(db, 'artifacts', appId, 'public', 'data', 'chat');

  useEffect(() => {
    if (!isAuthReady) return;
    const unsubscribe = onSnapshot(chatRef, (snapshot) => {
      const messagesData = [];
      snapshot.forEach(doc => {
        messagesData.push({ id: doc.id, ...doc.data() });
      });
      // Sort messages by timestamp, if a timestamp field existed. For now, we'll just use the default order.
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [isAuthReady, userId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    try {
      await addDoc(chatRef, {
        userId: userId,
        message: newMessage,
        timestamp: new Date().toISOString()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 relative overflow-hidden flex flex-col">
      <CyberGrid />
      <CyberNavMain navigate={navigate} connectWallet={connectWallet}/>
      <div className="relative z-10 pt-24 pb-16 px-4 flex-grow max-w-2xl mx-auto w-full">
        <h1 className="text-4xl font-mono font-black text-green-400 mb-8 text-center animate-pulse">
          COMMUNITY CHAT
        </h1>
        <div className="flex flex-col h-[70vh] bg-black/50 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 space-y-4">
          <div className="flex-grow overflow-y-auto space-y-4 pr-2">
            {messages.map((msg, index) => (
              <div key={index} className="flex flex-col">
                <span className={`text-xs font-mono mb-1 ${msg.userId === userId ? 'text-purple-400 text-right' : 'text-blue-400'}`}>
                  {msg.userId === userId ? 'You' : `User: ${msg.userId}`}
                </span>
                <div className={`p-3 rounded-lg max-w-[75%] font-mono text-sm ${
                  msg.userId === userId
                    ? 'bg-purple-500/20 border border-purple-500/30 self-end'
                    : 'bg-blue-500/20 border border-blue-500/30 self-start'
                }`}>
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="flex mt-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow px-4 py-3 bg-black border border-green-500/30 text-green-400 font-mono rounded-l focus:outline-none focus:border-purple-500"
              disabled={!userId}
            />
            <button
              type="submit"
              className="px-6 py-3 bg-green-500/20 border border-green-500 text-green-400 font-mono font-bold tracking-wider hover:bg-green-500 hover:text-black transition-all duration-300 rounded-r disabled:bg-gray-600 disabled:border-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
              disabled={!userId}
            >
              SEND
            </button>
          </form>
          {!userId && (
            <p className="text-center text-xs text-orange-400 font-mono mt-2">
              You must be logged in to chat. Please connect your wallet.
            </p>
          )}
        </div>
      </div>
      <CyberFooter />
    </div>
  );
};


// --- Main App Component with switch-case navigation ---
const App = () => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);
  const [currentPage, setCurrentPage] = useState(window.location.pathname);
  const { connected: walletConnected, connect: connectWallet } = useWallet();

  // Function to simulate navigation
  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPage(path);
  };

  useEffect(() => {
    // Listen for back/forward browser button clicks
    const handlePopState = () => {
      setCurrentPage(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const signIn = async () => {
      try {
        if (auth_token) {
          await signInWithCustomToken(auth, auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Firebase Auth Error:", error);
      }
    };

    signIn();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-green-400 font-mono">
        <div className="animate-pulse">Loading NimRev...</div>
      </div>
    );
  }

  // Use a switch statement to render the correct component based on the path
  switch (currentPage) {
    case '/':
      return <HomePage navigate={navigate} />;
    case '/explorer':
    case '/grid':
    case '/terminal':
    case '/about':
    case '/dashboard':
    case '/whitepaper':
    case '/technology':
    case '/roadmap':
    case '/community':
    case '/contact':
    case '/privacy':
    case '/terms':
    case '/disclaimer':
    case '/age-restriction':
    case '/nimrev-dashboard':
    case '/bot-platform':
    case '/security-audit':
    case '/blogs':
        const title = currentPage.substring(1).replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        return <OtherPage title={title} />;
    case '/staking':
      return <StakingEnhanced userId={userId} isAuthReady={isAuthReady} navigate={navigate} />;
    case '/chat':
      return <ChatPage userId={userId} isAuthReady={isAuthReady} navigate={navigate} connectWallet={connectWallet}/>;
    default:
      return <NotFoundPage />;
  }
};

export default App;
