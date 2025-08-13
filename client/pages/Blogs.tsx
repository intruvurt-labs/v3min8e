import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDynamicSEO, useSEOTracking } from "@/hooks/useDynamicSEO";
import CyberNav from "@/components/CyberNav";
import CyberFooter from "@/components/CyberFooter";
import CyberGrid from "@/components/CyberGrid";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
  tags: string[];
  featured?: boolean;
}

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Understanding Cross-Chain Security Vulnerabilities in 2024",
    excerpt:
      "Deep dive into the latest attack vectors targeting cross-chain bridges and how NimRev's SUBVERSION SWEEP technology protects against them.",
    date: "2024-01-15",
    category: "Security Research",
    readTime: "8 min",
    tags: ["Security", "Cross-Chain", "Vulnerabilities"],
    featured: true,
  },
  {
    id: "2",
    title: "Deconstructing Rug Pull Patterns: A Technical Analysis",
    excerpt:
      "Analysis of 500+ rug pulls reveals predictable patterns that our threat scoring engine can detect seconds before execution.",
    date: "2024-01-12",
    category: "Threat Intelligence",
    readTime: "12 min",
    tags: ["Rug Pulls", "Pattern Analysis", "Detection"],
  },
  {
    id: "3",
    title: "The Evolution of DeFi Honeypots: From Simple to Sophisticated",
    excerpt:
      "How honeypot contracts have evolved and the machine learning techniques we use to identify even the most sophisticated traps.",
    date: "2024-01-10",
    category: "DeFi Security",
    readTime: "6 min",
    tags: ["DeFi", "Honeypots", "Machine Learning"],
  },
  {
    id: "4",
    title: "Building Transparent Security: The NimRev Approach",
    excerpt:
      "Why transparency matters in security auditing and how our immutable ledger system ensures every scan result is verifiable.",
    date: "2024-01-08",
    category: "Platform Updates",
    readTime: "5 min",
    tags: ["Transparency", "Auditing", "Blockchain"],
  },
  {
    id: "5",
    title: "Community-Driven Intelligence: The Power of Collective Security",
    excerpt:
      "How community voting and weighted intelligence systems create a more accurate and responsive threat detection network.",
    date: "2024-01-05",
    category: "Community",
    readTime: "7 min",
    tags: ["Community", "Intelligence", "Voting"],
  },
  {
    id: "6",
    title: "Zero-Knowledge Proofs in Security Auditing",
    excerpt:
      "Exploring how ZK-proofs can enhance privacy while maintaining transparency in security audit processes.",
    date: "2024-01-03",
    category: "Technology",
    readTime: "10 min",
    tags: ["Zero-Knowledge", "Privacy", "Cryptography"],
  },
];

const categories = [
  "All",
  "Security Research",
  "Threat Intelligence",
  "DeFi Security",
  "Platform Updates",
  "Community",
  "Technology",
];

export default function Blogs() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPosts, setFilteredPosts] = useState(blogPosts);

  // Initialize dynamic SEO for blogs
  const { trackSearch } = useDynamicSEO("blogs", {
    totalPosts: blogPosts.length,
    categories: categories.slice(1), // Exclude "All"
  });
  const { trackInteraction } = useSEOTracking();

  useEffect(() => {
    let filtered = blogPosts;

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter((post) => post.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );
    }

    setFilteredPosts(filtered);
  }, [selectedCategory, searchQuery]);

  const featuredPost = blogPosts.find((post) => post.featured);
  const regularPosts = filteredPosts.filter((post) => !post.featured);

  return (
    <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
      <CyberGrid intensity="low" animated={true} />
      <CyberNav />

      <main className="relative z-10 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-6xl font-cyber font-black text-cyber-green mb-6 neon-glow">
              SECURITY INTELLIGENCE
            </h1>
            <p className="text-xl text-gray-300 font-mono leading-relaxed max-w-3xl mx-auto">
              <span className="text-cyber-orange italic">
                "Knowledge is power. Shared knowledge is unstoppable."
              </span>
              <br />
              <br />
              Deep insights into blockchain security, threat analysis, and the
              latest attack vectors from the NimRev research team.
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-12">
            <div className="max-w-4xl mx-auto">
              {/* Search Input */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search articles, tags, or topics..."
                  value={searchQuery}
                  onChange={(e) => {
                    const query = e.target.value;
                    setSearchQuery(query);
                    if (query.length > 2) {
                      trackSearch(query);
                      trackInteraction("blog_search", { searchQuery: query });
                    }
                  }}
                  className="w-full px-6 py-4 bg-dark-bg/50 border-2 border-cyber-green/30 text-cyber-green font-mono text-lg focus:border-cyber-green focus:outline-none transition-all duration-200 neon-border"
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 font-mono text-sm tracking-wider transition-all duration-300 border ${
                      selectedCategory === category
                        ? "border-cyber-green bg-cyber-green/20 text-cyber-green neon-glow"
                        : "border-cyber-blue/30 text-cyber-blue hover:border-cyber-blue hover:bg-cyber-blue/10"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Featured Article */}
          {featuredPost && selectedCategory === "All" && !searchQuery && (
            <div className="mb-16">
              <h2 className="text-2xl font-cyber font-bold text-cyber-orange mb-8 text-center">
                FEATURED RESEARCH
              </h2>
              <div className="bg-gradient-to-r from-cyber-green/10 to-cyber-blue/10 border-2 border-cyber-green/50 p-8 hover:border-cyber-green transition-all duration-300 neon-border">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <span className="bg-cyber-green/20 text-cyber-green px-3 py-1 text-xs font-mono font-bold border border-cyber-green/50">
                    {featuredPost.category}
                  </span>
                  <span className="text-cyber-blue font-mono text-sm">
                    {new Date(featuredPost.date).toLocaleDateString()} •{" "}
                    {featuredPost.readTime} read
                  </span>
                </div>
                <h3 className="text-2xl lg:text-3xl font-cyber font-bold text-cyber-green mb-4 neon-glow">
                  {featuredPost.title}
                </h3>
                <p className="text-gray-300 font-mono text-lg leading-relaxed mb-6">
                  {featuredPost.excerpt}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {featuredPost.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-cyber-purple text-xs font-mono bg-cyber-purple/10 px-2 py-1 border border-cyber-purple/30"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <button className="group relative px-6 py-3 bg-cyber-green/20 border-2 border-cyber-green text-cyber-green font-mono font-bold tracking-wider hover:bg-cyber-green hover:text-dark-bg transition-all duration-300 neon-border">
                  <span className="relative z-10">READ FULL ANALYSIS</span>
                  <div className="absolute inset-0 bg-cyber-green/10 group-hover:bg-cyber-green/20 transition-all duration-300"></div>
                </button>
              </div>
            </div>
          )}

          {/* Articles Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post) => (
              <article
                key={post.id}
                className="group border border-cyber-blue/30 bg-dark-bg/50 hover:border-cyber-blue hover:bg-cyber-blue/5 transition-all duration-300 p-6"
              >
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <span className="bg-cyber-blue/20 text-cyber-blue px-3 py-1 text-xs font-mono font-bold border border-cyber-blue/50">
                    {post.category}
                  </span>
                  <span className="text-gray-400 font-mono text-xs">
                    {new Date(post.date).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-xl font-cyber font-bold text-cyber-blue mb-3 group-hover:text-cyber-green transition-colors duration-300">
                  {post.title}
                </h3>

                <p className="text-gray-300 font-mono text-sm leading-relaxed mb-4">
                  {post.excerpt}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-cyber-orange text-xs font-mono bg-cyber-orange/10 px-2 py-1 border border-cyber-orange/30"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-cyber-purple font-mono text-xs">
                    {post.readTime} read
                  </span>
                  <button className="text-cyber-blue hover:text-cyber-green transition-colors font-mono text-sm font-bold">
                    READ MORE →
                  </button>
                </div>

                {/* Hover scan effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyber-blue/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 scan-line"></div>
              </article>
            ))}
          </div>

          {/* No Results */}
          {filteredPosts.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-cyber font-bold text-cyber-orange mb-4">
                No Articles Found
              </h3>
              <p className="text-gray-400 font-mono">
                Try adjusting your search terms or category filter.
              </p>
            </div>
          )}

          {/* Newsletter Signup */}
          <div className="mt-20 border border-cyber-green/50 p-8 bg-cyber-green/5 text-center neon-border">
            <h3 className="text-2xl font-cyber font-bold text-cyber-green mb-4">
              STAY INFORMED
            </h3>
            <p className="text-gray-300 font-mono mb-6">
              Get the latest security intelligence and research insights
              delivered directly to your inbox.
            </p>
            <div className="max-w-md mx-auto flex gap-2">
              <input
                type="email"
                placeholder="ghost@protonmail.com"
                className="flex-1 px-4 py-3 bg-dark-bg border border-cyber-green/30 text-cyber-green font-mono focus:border-cyber-green focus:outline-none transition-all duration-200"
              />
              <button className="px-6 py-3 bg-cyber-green/20 border-2 border-cyber-green text-cyber-green font-mono font-bold hover:bg-cyber-green hover:text-dark-bg transition-all duration-300 neon-border">
                SUBSCRIBE
              </button>
            </div>
          </div>
        </div>
      </main>

      <CyberFooter />
    </div>
  );
}
