'use client';

import { useState, useEffect, useRef } from 'react';
import { useWalletContext } from '../contexts/WalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import io from 'socket.io-client';
import { Button, notification } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

type LayoutOption = 'AUTO' | 'TOP_BOTTOM' | 'SPLIT_PANEL' | 'QUOTE_CARD';

interface GeneratedMeme {
  image: string;
  meta: any;
  hash: string;
  shortHash: string;
  filename: string;
  isSafe: boolean;
}

const RainParticle = ({ currency }: { currency: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [exploded, setExploded] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y -= 0.1;
      if (meshRef.current.position.y < -5 && !exploded) {
        setExploded(true);
        meshRef.current.scale.set(2, 2, 2);
        setTimeout(() => meshRef.current?.scale.set(0, 0, 0), 500);
      }
    }
  });

  return (
    <mesh ref={meshRef} position={[Math.random() * 10 - 5, 5, 0]}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshBasicMaterial color={exploded ? '#FFD700' : '#00BFFF'} />
      <sprite position={[0, 0, 0.1]}>
        <spriteMaterial color={exploded ? '#FFD700' : '#FFFFFF'}>
          <canvasTexture attach="map" image={document.createElement('canvas')} />
        </spriteMaterial>
        <div className="text-2xl">{currency}</div>
      </sprite>
    </mesh>
  );
};

export default function MemeGenerator() {
  const { connected, publicKey, role, isCreator, isOwner } = useWalletContext();
  const [prompt, setPrompt] = useState('');
  const [selectedLayout, setSelectedLayout] = useState<LayoutOption>('AUTO');
  const [generatedMeme, setGeneratedMeme] = useState<GeneratedMeme | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socket = io('ws://your-backend-url');
  const currencies = ['$', '¥', '₽', '₦', 'A$', 'NPR', 'R$'];

  useEffect(() => {
    socket.on('generation_progress', (data: { scan_id: string; message: string }) => {
      notification.info({ message: 'Progress', description: data.message });
    });
    socket.on('scan_result', (data: { scan_id: string; status: string; issues: any[] }) => {
      if (data.status === 'FAIL') {
        notification.error({ message: 'Security Alert', description: 'Meme flagged as unsafe and quarantined.' });
      }
    });
    return () => socket.disconnect();
  }, []);

  const generateMeme = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt for your meme');
      return;
    }
    if (!connected || !isCreator) {
      setError('Connect wallet and ensure CREATOR role to generate');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const signature = await signMessage(prompt); // Sign for auth
      const response = await fetch('/api/generate-meme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), layout: selectedLayout, signature, publicKey: publicKey?.toBase58() }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to generate meme');

      // Scan meme for safety
      const scanResponse = await fetch('/api/scan-meme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: result.data.image }),
      });
      const scanResult = await scanResponse.json();
      setGeneratedMeme({ ...result.data, isSafe: scanResult.status === 'PASS' });

      if (scanResult.status !== 'PASS') {
        await fetch('/api/quarantine-meme', { method: 'POST', body: JSON.stringify({ scan_id: scanResult.scan_id }) });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadMeme = () => {
    if (!generatedMeme || !generatedMeme.isSafe) return;
    const link = document.createElement('a');
    link.download = generatedMeme.filename || `odinary-meme-${generatedMeme.shortHash}.png`;
    link.href = generatedMeme.image;
    link.click();
  };

  const mintMeme = async () => {
    if (!connected || !isCreator || !generatedMeme || !generatedMeme.isSafe) {
      setError('Connect wallet, ensure CREATOR role, or verify meme safety');
      return;
    }
    const signature = await signMessage(generatedMeme.hash);
    await fetch('/api/mint-nft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: generatedMeme.image, hash: generatedMeme.hash, signature, publicKey: publicKey?.toBase58() }),
    });
    notification.success({ message: 'NFT Minted', description: 'Meme minted to Solana!' });
  };

  const signMessage = async (message: string) => {
    if (!publicKey || !window.solana?.signMessage) throw new Error('Wallet does not support signing');
    const encodedMessage = new TextEncoder().encode(message);
    const { signature } = await window.solana.signMessage(encodedMessage, 'utf8');
    return Buffer.from(signature).toString('base64');
  };

  const layoutOptions = [
    { value: 'AUTO', label: 'Auto-Select', description: 'Let AI choose the best layout' },
    { value: 'TOP_BOTTOM', label: 'Top/Bottom', description: 'Classic meme with text above and below' },
    { value: 'SPLIT_PANEL', label: 'Split Panel', description: 'Side-by-side comparison layout' },
    { value: 'QUOTE_CARD', label: 'Quote Card', description: 'Quote-style card layout' },
  ];

  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Glitch Sandpaper Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('/sandpaper-texture.png')] opacity-20 animate-glitch" />
        <style jsx>{`
          @keyframes glitch {
            0% { transform: translate(0); }
            20% { transform: translate(-2px, 2px); }
            40% { transform: translate(2px, -2px); }
            60% { transform: translate(-1px, 1px); }
            80% { transform: translate(1px, -1px); }
            100% { transform: translate(0); }
          }
          .animate-glitch {
            animation: glitch 1s infinite;
          }
        `}</style>
        <Canvas style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <ambientLight intensity={0.5} />
          {currencies.map((currency, i) => (
            <RainParticle key={i} currency={currency} />
          ))}
        </Canvas>
      </div>

      <div className="relative z-10 text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500/20 to-gold-500/20 rounded-full border border-red-500/30 mb-4"
        >
          <span className="text-sm font-medium text-red-400">BRAND-LOCKED GENERATOR</span>
        </motion.div>
        <motion.h2
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-4xl font-bold bg-gradient-to-r from-red-400 via-gold-400 to-red-400 bg-clip-text text-transparent mb-2"
        >
          ODINARY Meme Generator
        </motion.h2>
        <p className="text-slate-400">Create secure, brand-consistent meme NFTs</p>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Inputs */}
        <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
            <h3 className="text-xl font-semibold mb-4 text-gold-400">Meme Prompt</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
              placeholder="Enter your meme text here..."
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-slate-400 mt-1">{prompt.length}/500 characters</div>

            <label className="block text-sm font-medium mb-2 text-slate-300 mt-4">Layout Style</label>
            <select
              value={selectedLayout}
              onChange={(e) => setSelectedLayout(e.target.value as LayoutOption)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-red-500 focus:ring-1 focus:ring-red-500"
            >
              {layoutOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full"
          >
            <WalletMultiButton
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                connected
                  ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg hover:shadow-green-500/25'
                  : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg hover:shadow-red-500/25'
              }`}
            >
              {connected ? `Connected: ${publicKey?.toBase58().slice(0, 8)}...` : 'Connect Wallet'}
            </WalletMultiButton>
          </motion.div>

          <Button
            onClick={generateMeme}
            disabled={!prompt.trim() || isGenerating || !isCreator}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
              !prompt.trim() || isGenerating || !isCreator
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg hover:shadow-red-500/25'
            }`}
          >
            {isGenerating ? (
              <div className="flex items-center justify-center space-x-2">
                <LoadingOutlined />
                <span>Generating Secure Meme...</span>
              </div>
            ) : (
              'Generate Brand-Locked Meme'
            )}
          </Button>

          {isOwner && (
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
              <h3 className="text-xl font-semibold mb-4 text-gold-400">Admin Panel</h3>
              <p className="text-slate-400">Scan Logs: View quarantined memes and audit trails.</p>
              {/* Add log viewer component here */}
            </div>
          )}
        </motion.div>

        {/* Right: Preview */}
        <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
            <h3 className="text-xl font-semibold mb-4 text-gold-400">Preview</h3>
            <div className="border-2 border-slate-600 rounded-xl overflow-hidden bg-slate-900/50 flex items-center justify-center" style={{ minHeight: '400px' }}>
              <AnimatePresence>
                {generatedMeme ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative"
                  >
                    <img
                      src={generatedMeme.image}
                      alt="Generated ODINARY meme"
                      className="max-w-full max-h-[400px] rounded-lg shadow-2xl"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-gold-400">
                      #{generatedMeme.shortHash}
                    </div>
                    {!generatedMeme.isSafe && (
                      <div className="absolute bottom-2 left-2 bg-red-500/70 px-2 py-1 rounded text-xs text-white">
                        Quarantined: Unsafe Content
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center p-8 text-slate-400"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500/20 to-gold-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium mb-2">Your ODINARY meme will appear here</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {generatedMeme && (
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
              <h3 className="text-xl font-semibold mb-4 text-gold-400">Actions</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Button
                  onClick={downloadMeme}
                  disabled={!generatedMeme.isSafe}
                  className="py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download</span>
                </Button>
                <Button
                  onClick={mintMeme}
                  disabled={!connected || !isCreator || !generatedMeme.isSafe}
                  className={`py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 ${
                    !connected || !isCreator || !generatedMeme.isSafe
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-500 text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span>Mint NFT</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
