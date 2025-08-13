import { ethers } from "ethers";
import { BlockchainType, BytecodeAnalysis } from "../../shared/nimrev-types";
import crypto from "crypto";

interface KnownExploit {
  name: string;
  bytecode_hash: string;
  function_signatures: string[];
  description: string;
}

export class BytecodeAnalyzer {
  private providers: Map<BlockchainType, ethers.JsonRpcProvider> = new Map();
  private knownExploits: KnownExploit[] = [];

  constructor() {
    this.initializeProviders();
    this.loadKnownExploits();
  }

  private initializeProviders() {
    const evmChains = {
      ethereum: "https://eth.llamarpc.com",
      base: "https://mainnet.base.org",
      blast: "https://rpc.blast.io",
      polygon: "https://polygon-rpc.com",
      avalanche: "https://api.avax.network/ext/bc/C/rpc",
      arbitrum: "https://arb1.arbitrum.io/rpc",
      optimism: "https://mainnet.optimism.io",
    };

    for (const [chain, rpc] of Object.entries(evmChains)) {
      this.providers.set(
        chain as BlockchainType,
        new ethers.JsonRpcProvider(rpc),
      );
    }
  }

  private loadKnownExploits() {
    // Load known exploit patterns
    this.knownExploits = [
      {
        name: "Unlimited Mint Exploit",
        bytecode_hash: "example_hash_1",
        function_signatures: ["40c10f19"], // mint(address,uint256)
        description: "Contract allows unlimited token minting",
      },
      {
        name: "Hidden Ownership Transfer",
        bytecode_hash: "example_hash_2",
        function_signatures: ["f2fde38b"], // transferOwnership(address)
        description: "Ownership can be transferred without restrictions",
      },
      {
        name: "Backdoor Function",
        bytecode_hash: "example_hash_3",
        function_signatures: ["ffffffff"], // Custom backdoor
        description: "Hidden backdoor function for unauthorized access",
      },
    ];
  }

  public async analyzeBytecode(
    contractAddress: string,
    blockchain: BlockchainType,
  ): Promise<BytecodeAnalysis> {
    console.log(`🔍 Analyzing bytecode for ${blockchain}:${contractAddress}`);

    const analysis: BytecodeAnalysis = {
      contract_size: 0,
      function_count: 0,
      has_mint_function: false,
      has_burn_function: false,
      has_pause_function: false,
      has_ownership_transfer: false,
      external_calls: [],
      similarity_matches: [],
      hidden_functions: [],
      proxy_pattern: false,
      upgrade_pattern: false,
      time_locks: [],
      access_controls: [],
    };

    try {
      const provider = this.providers.get(blockchain);
      if (!provider) {
        throw new Error(`Provider not available for ${blockchain}`);
      }

      // Get contract bytecode
      const bytecode = await provider.getCode(contractAddress);
      if (bytecode === "0x") {
        throw new Error("No contract found at address");
      }

      analysis.contract_size = bytecode.length;

      // Parse function signatures from bytecode
      const functionSignatures = this.extractFunctionSignatures(bytecode);
      analysis.function_count = functionSignatures.length;

      // Analyze common functions
      analysis.has_mint_function = this.hasFunctionSignature(
        functionSignatures,
        [
          "40c10f19", // mint(address,uint256)
          "a0712d68", // mint(uint256)
        ],
      );

      analysis.has_burn_function = this.hasFunctionSignature(
        functionSignatures,
        [
          "42966c68", // burn(uint256)
          "9dc29fac", // burn(address,uint256)
        ],
      );

      analysis.has_pause_function = this.hasFunctionSignature(
        functionSignatures,
        [
          "8456cb59", // pause()
          "3f4ba83a", // unpause()
        ],
      );

      analysis.has_ownership_transfer = this.hasFunctionSignature(
        functionSignatures,
        [
          "f2fde38b", // transferOwnership(address)
          "715018a6", // renounceOwnership()
        ],
      );

      // Detect access control patterns
      analysis.access_controls = this.detectAccessControls(
        functionSignatures,
        bytecode,
      );

      // Detect proxy patterns
      analysis.proxy_pattern = this.detectProxyPattern(bytecode);
      analysis.upgrade_pattern = this.detectUpgradePattern(bytecode);

      // Find external calls
      analysis.external_calls = this.findExternalCalls(bytecode);

      // Detect hidden functions
      analysis.hidden_functions = this.detectHiddenFunctions(
        functionSignatures,
        bytecode,
      );

      // Find time locks
      analysis.time_locks = this.findTimeLocks(bytecode);

      // Check similarity to known exploits
      analysis.similarity_matches = await this.checkSimilarityToKnownExploits(
        bytecode,
        functionSignatures,
        blockchain,
      );

      console.log(
        `✅ Bytecode analysis completed: ${analysis.function_count} functions, ${analysis.similarity_matches.length} similarity matches`,
      );
      return analysis;
    } catch (error) {
      console.error("Bytecode analysis failed:", error);
      throw error;
    }
  }

  private extractFunctionSignatures(bytecode: string): string[] {
    const signatures: string[] = [];

    // Look for function selector patterns in bytecode
    // Function selectors are 4-byte signatures that appear at the beginning of functions
    const regex = /63([a-fA-F0-9]{8})/g;
    let match;

    while ((match = regex.exec(bytecode)) !== null) {
      const signature = match[1].toLowerCase();
      if (!signatures.includes(signature)) {
        signatures.push(signature);
      }
    }

    // Also look for PUSH4 instructions followed by function selectors
    const push4Regex = /63([a-fA-F0-9]{8})/g;
    let push4Match;

    while ((push4Match = push4Regex.exec(bytecode)) !== null) {
      const signature = push4Match[1].toLowerCase();
      if (!signatures.includes(signature)) {
        signatures.push(signature);
      }
    }

    return signatures;
  }

  private hasFunctionSignature(
    signatures: string[],
    targetSignatures: string[],
  ): boolean {
    return targetSignatures.some((target) =>
      signatures.includes(target.toLowerCase()),
    );
  }

  private detectAccessControls(
    signatures: string[],
    bytecode: string,
  ): string[] {
    const accessControls: string[] = [];

    // Check for OpenZeppelin access control patterns
    const accessControlSignatures = {
      onlyOwner: ["8da5cb5b"], // owner()
      onlyRole: ["91d14854"], // hasRole(bytes32,address)
      whenNotPaused: ["5c975abb"], // paused()
      whenPaused: ["5c975abb"],
      nonReentrant: ["dde43cba"], // Custom reentrancy guard
    };

    for (const [control, sigs] of Object.entries(accessControlSignatures)) {
      if (this.hasFunctionSignature(signatures, sigs)) {
        accessControls.push(control);
      }
    }

    // Check for custom modifiers in bytecode
    if (bytecode.includes("revert") || bytecode.includes("require")) {
      accessControls.push("custom_modifiers");
    }

    return accessControls;
  }

  private detectProxyPattern(bytecode: string): boolean {
    // Look for proxy patterns like OpenZeppelin's proxy
    const proxyPatterns = [
      "360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc", // EIP-1967 implementation slot
      "7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3", // EIP-1967 admin slot
      "delegatecall", // DELEGATECALL opcode
      "5c60da1b", // implementation() function
    ];

    return proxyPatterns.some((pattern) =>
      bytecode.toLowerCase().includes(pattern),
    );
  }

  private detectUpgradePattern(bytecode: string): boolean {
    // Look for upgrade patterns
    const upgradeSignatures = [
      "3659cfe6", // upgradeTo(address)
      "4f1ef286", // upgradeToAndCall(address,bytes)
      "99a88ec4", // upgrade(address)
    ];

    return upgradeSignatures.some((sig) => bytecode.includes(sig));
  }

  private findExternalCalls(bytecode: string): string[] {
    const externalCalls: string[] = [];

    // Look for CALL, DELEGATECALL, STATICCALL opcodes
    const callPatterns = [
      "f1", // CALL
      "f4", // DELEGATECALL
      "fa", // STATICCALL
    ];

    for (const pattern of callPatterns) {
      if (bytecode.includes(pattern)) {
        externalCalls.push(`external_call_${pattern}`);
      }
    }

    return externalCalls;
  }

  private detectHiddenFunctions(
    signatures: string[],
    bytecode: string,
  ): string[] {
    const hiddenFunctions: string[] = [];

    // Look for functions that aren't in standard interfaces
    const standardERC20Signatures = [
      "18160ddd", // totalSupply()
      "70a08231", // balanceOf(address)
      "a9059cbb", // transfer(address,uint256)
      "23b872dd", // transferFrom(address,address,uint256)
      "095ea7b3", // approve(address,uint256)
      "dd62ed3e", // allowance(address,address)
    ];

    const standardOwnershipSignatures = [
      "8da5cb5b", // owner()
      "f2fde38b", // transferOwnership(address)
      "715018a6", // renounceOwnership()
    ];

    const allStandardSignatures = [
      ...standardERC20Signatures,
      ...standardOwnershipSignatures,
    ];

    for (const signature of signatures) {
      if (!allStandardSignatures.includes(signature)) {
        // This might be a hidden or custom function
        hiddenFunctions.push(signature);
      }
    }

    // Look for obfuscated function patterns
    if (bytecode.includes("ff") && bytecode.includes("revert")) {
      hiddenFunctions.push("obfuscated_revert_pattern");
    }

    return hiddenFunctions.slice(0, 10); // Limit to avoid spam
  }

  private findTimeLocks(bytecode: string): number[] {
    const timeLocks: number[] = [];

    // Look for common timelock values (in seconds)
    const commonTimeLocks = [
      86400, // 1 day
      259200, // 3 days
      604800, // 1 week
      2592000, // 30 days
      7776000, // 90 days
    ];

    for (const timelock of commonTimeLocks) {
      const hex = timelock.toString(16).padStart(8, "0");
      if (bytecode.toLowerCase().includes(hex)) {
        timeLocks.push(timelock);
      }
    }

    return timeLocks;
  }

  private async checkSimilarityToKnownExploits(
    bytecode: string,
    signatures: string[],
    blockchain: BlockchainType,
  ): Promise<
    Array<{
      contract_address: string;
      similarity_score: number;
      blockchain: BlockchainType;
    }>
  > {
    const matches: Array<{
      contract_address: string;
      similarity_score: number;
      blockchain: BlockchainType;
    }> = [];

    try {
      // Calculate bytecode hash
      const bytecodeHash = crypto
        .createHash("sha256")
        .update(bytecode)
        .digest("hex");

      // Check against known exploits
      for (const exploit of this.knownExploits) {
        const similarity = this.calculateBytcodeSimilarity(
          bytecode,
          exploit.bytecode_hash,
        );
        const functionSimilarity = this.calculateFunctionSimilarity(
          signatures,
          exploit.function_signatures,
        );

        const combinedSimilarity = similarity * 0.7 + functionSimilarity * 0.3;

        if (combinedSimilarity > 0.5) {
          matches.push({
            contract_address: exploit.name,
            similarity_score: combinedSimilarity,
            blockchain,
          });
        }
      }

      // In a real implementation, would also check against a database of known malicious contracts
      await this.checkAgainstMaliciousDatabase(
        bytecodeHash,
        signatures,
        blockchain,
        matches,
      );

      return matches.sort((a, b) => b.similarity_score - a.similarity_score);
    } catch (error) {
      console.error("Similarity check failed:", error);
      return matches;
    }
  }

  private calculateBytcodeSimilarity(
    bytecode1: string,
    bytecode2: string,
  ): number {
    // Simplified similarity calculation
    // In a real implementation, would use more sophisticated algorithms like fuzzy hashing

    if (bytecode1 === bytecode2) return 1.0;

    const hash1 = crypto.createHash("sha256").update(bytecode1).digest("hex");
    const hash2 = crypto.createHash("sha256").update(bytecode2).digest("hex");

    // Simple hamming distance for demonstration
    let differences = 0;
    for (let i = 0; i < Math.min(hash1.length, hash2.length); i++) {
      if (hash1[i] !== hash2[i]) differences++;
    }

    return 1 - differences / Math.max(hash1.length, hash2.length);
  }

  private calculateFunctionSimilarity(
    signatures1: string[],
    signatures2: string[],
  ): number {
    if (signatures1.length === 0 && signatures2.length === 0) return 1.0;
    if (signatures1.length === 0 || signatures2.length === 0) return 0.0;

    const commonSignatures = signatures1.filter((sig) =>
      signatures2.includes(sig),
    );
    const totalSignatures = new Set([...signatures1, ...signatures2]).size;

    return commonSignatures.length / totalSignatures;
  }

  private async checkAgainstMaliciousDatabase(
    bytecodeHash: string,
    signatures: string[],
    blockchain: BlockchainType,
    matches: Array<{
      contract_address: string;
      similarity_score: number;
      blockchain: BlockchainType;
    }>,
  ) {
    try {
      // In a real implementation, this would query a database of known malicious contracts
      // For now, simulate with some mock data

      const mockMaliciousContracts = [
        {
          address: "0x1234567890123456789012345678901234567890",
          blockchain: "ethereum" as BlockchainType,
          risk_level: "high",
          signatures: ["40c10f19", "f2fde38b"],
        },
        {
          address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          blockchain: "base" as BlockchainType,
          risk_level: "medium",
          signatures: ["42966c68", "8da5cb5b"],
        },
      ];

      for (const maliciousContract of mockMaliciousContracts) {
        const functionSimilarity = this.calculateFunctionSimilarity(
          signatures,
          maliciousContract.signatures,
        );

        if (functionSimilarity > 0.6) {
          matches.push({
            contract_address: maliciousContract.address,
            similarity_score: functionSimilarity,
            blockchain: maliciousContract.blockchain,
          });
        }
      }
    } catch (error) {
      console.error("Database check failed:", error);
    }
  }

  public async getContractCreationCode(
    contractAddress: string,
    blockchain: BlockchainType,
  ): Promise<string | null> {
    try {
      const provider = this.providers.get(blockchain);
      if (!provider) return null;

      // Get creation transaction (this would require additional APIs or services)
      // For now, return runtime bytecode
      return await provider.getCode(contractAddress);
    } catch (error) {
      console.error("Failed to get creation code:", error);
      return null;
    }
  }

  public getFunctionSignatureInfo(
    signature: string,
  ): { name: string; description: string } | null {
    const knownSignatures: Record<
      string,
      { name: string; description: string }
    > = {
      "40c10f19": {
        name: "mint(address,uint256)",
        description: "Mint new tokens to an address",
      },
      "42966c68": {
        name: "burn(uint256)",
        description: "Burn tokens from caller",
      },
      a9059cbb: {
        name: "transfer(address,uint256)",
        description: "Transfer tokens",
      },
      "23b872dd": {
        name: "transferFrom(address,address,uint256)",
        description: "Transfer tokens from allowance",
      },
      "095ea7b3": {
        name: "approve(address,uint256)",
        description: "Approve token spending",
      },
      "70a08231": {
        name: "balanceOf(address)",
        description: "Get token balance",
      },
      "18160ddd": {
        name: "totalSupply()",
        description: "Get total token supply",
      },
      dd62ed3e: {
        name: "allowance(address,address)",
        description: "Get spending allowance",
      },
      "8da5cb5b": { name: "owner()", description: "Get contract owner" },
      f2fde38b: {
        name: "transferOwnership(address)",
        description: "Transfer contract ownership",
      },
      "715018a6": {
        name: "renounceOwnership()",
        description: "Renounce contract ownership",
      },
      "8456cb59": {
        name: "pause()",
        description: "Pause contract functionality",
      },
      "3f4ba83a": {
        name: "unpause()",
        description: "Unpause contract functionality",
      },
      "5c975abb": {
        name: "paused()",
        description: "Check if contract is paused",
      },
    };

    return knownSignatures[signature.toLowerCase()] || null;
  }
}
