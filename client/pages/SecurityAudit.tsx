import React, { useState, useEffect } from "react";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
} from "firebase/auth";

// This is a placeholder for your Firebase configuration
// In a real app, this would be imported from a config file.
const firebaseConfig =
  typeof __firebase_config !== "undefined" ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
const initialAuthToken =
  typeof __initial_auth_token !== "undefined" ? __initial_auth_token : null;

// --- ErrorBoundary Component ---
// This component catches JavaScript errors in its children.
// It is useful for preventing the entire app from crashing due to a single error.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
    console.error("Caught an error in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg text-center">
            <h1 className="text-3xl font-bold text-red-600 mb-4">
              Something went wrong.
            </h1>
            <p className="text-gray-700 mb-4">
              An unexpected error occurred in the application. Please try
              refreshing the page.
            </p>
            {this.props.showDetails && (
              <details className="text-sm text-gray-500 mt-4 text-left">
                <summary className="cursor-pointer text-blue-500">
                  Click for error details
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded-md overflow-auto text-red-500">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// TechTooltip Component
// This component displays a tooltip on hover.
const TechTooltip = ({ children, tooltipText }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span className="relative inline-block cursor-pointer group">
      <span
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </span>
      {showTooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1 bg-gray-800 text-white text-sm rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {tooltipText}
        </span>
      )}
    </span>
  );
};

// SecurityAudit Component
// This component represents a security audit result with a technology-specific tooltip.
const SecurityAudit = ({ technology, issue }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        Audit Finding
      </h3>
      <p className="text-gray-600">
        A potential security vulnerability was found related to{" "}
        <span className="font-medium text-gray-900">{technology}</span>.
      </p>
      {/* This div correctly wraps the TechTooltip to avoid the DOM nesting error */}
      <div className="text-gray-600 mt-2">
        Learn more about
        <TechTooltip tooltipText={`This is a tooltip about ${technology}`}>
          <span className="text-blue-500 hover:underline ml-1 cursor-pointer">
            {technology}
          </span>
        </TechTooltip>
        and the specific issue: <span className="italic">{issue}</span>.
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [auditData, setAuditData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const firebaseAuth = getAuth(app);
        setDb(firestore);
        setAuth(firebaseAuth);

        if (initialAuthToken) {
          await signInWithCustomToken(firebaseAuth, initialAuthToken);
        } else {
          await signInAnonymously(firebaseAuth);
        }

        const user = firebaseAuth.currentUser;
        if (user) {
          setUserId(user.uid);
        } else {
          setUserId("anonymous-" + Math.random().toString(36).substring(2, 9));
        }
      } catch (e) {
        console.error("Error initializing Firebase:", e);
        setError(
          "Failed to initialize the app. Please check your configuration.",
        );
      } finally {
        setLoading(false);
      }
    };
    initializeFirebase();
  }, []);

  useEffect(() => {
    if (db && userId) {
      const q = collection(
        db,
        `/artifacts/${appId}/users/${userId}/security_audits`,
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const audits = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setAuditData(audits);
          setLoading(false);
        },
        (err) => {
          console.error("Failed to fetch data:", err);
          setError("Failed to load audit data.");
          setLoading(false);
        },
      );

      // Cleanup listener on unmount
      return () => unsubscribe();
    }
  }, [db, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-red-500 text-lg">Error: {error}</div>
      </div>
    );
  }

  return (
    <ErrorBoundary showDetails={true}>
      <div className="bg-gray-100 min-h-screen p-8 font-sans antialiased flex flex-col items-center">
        <div className="bg-white rounded-2xl p-6 shadow-md w-full max-w-3xl mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Security Audit Dashboard
          </h1>
          <p className="text-gray-500">Your personal security report.</p>
          <div className="mt-4 text-sm text-gray-500">
            User ID: <span className="font-mono text-gray-700">{userId}</span>
          </div>
        </div>

        <div className="w-full max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {auditData.length > 0 ? (
              auditData.map((audit) => (
                <SecurityAudit
                  key={audit.id}
                  technology={audit.technology}
                  issue={audit.issue}
                />
              ))
            ) : (
              <div className="md:col-span-2 text-center text-gray-500 p-8 rounded-2xl bg-white shadow-lg">
                <p>No audit data found. Try adding a new finding.</p>
                {/* Example of adding new data */}
                <button
                  onClick={async () => {
                    const auditsCollectionRef = collection(
                      db,
                      `/artifacts/${appId}/users/${userId}/security_audits`,
                    );
                    await setDoc(doc(auditsCollectionRef, "sample-1"), {
                      technology: "React",
                      issue: "Component nesting issues.",
                    });
                  }}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-colors"
                >
                  Add Sample Data
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
