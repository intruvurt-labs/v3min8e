const anchor = require("@coral-xyz/anchor");
const { Connection, Keypair, PublicKey } = require("@solana/web3.js");
const fs = require("fs");

// Configuration
const NETWORK = "mainnet-beta"; // Change to 'devnet' for testing
const RPC_URL =
  NETWORK === "mainnet-beta"
    ? "https://api.mainnet-beta.solana.com"
    : "https://api.devnet.solana.com";

// VERM Token Contract Address (replace with actual)
const VERM_TOKEN_MINT = "Auu4U7cVjm41yVnVtBCwHW2FBAKznPgLR7hQf4Esjups";

async function deployStakingContract() {
  console.log("🚀 Starting VERM Staking Contract Deployment...");
  console.log(`Network: ${NETWORK}`);
  console.log(`RPC: ${RPC_URL}`);

  try {
    // Initialize connection
    const connection = new Connection(RPC_URL, "confirmed");

    // Load or create keypair for deployment
    let deployerKeypair;
    try {
      const keypairFile = fs.readFileSync("./deployer-keypair.json");
      deployerKeypair = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(keypairFile)),
      );
      console.log(
        `✅ Loaded deployer keypair: ${deployerKeypair.publicKey.toBase58()}`,
      );
    } catch (error) {
      console.log("⚠️  No deployer keypair found, generating new one...");
      deployerKeypair = Keypair.generate();
      fs.writeFileSync(
        "./deployer-keypair.json",
        JSON.stringify(Array.from(deployerKeypair.secretKey)),
      );
      console.log(
        `✅ Generated new deployer keypair: ${deployerKeypair.publicKey.toBase58()}`,
      );
      console.log("💰 Please fund this address with SOL for deployment!");
      return;
    }

    // Check balance
    const balance = await connection.getBalance(deployerKeypair.publicKey);
    console.log(
      `💰 Deployer balance: ${balance / anchor.web3.LAMPORTS_PER_SOL} SOL`,
    );

    if (balance < 0.1 * anchor.web3.LAMPORTS_PER_SOL) {
      console.log(
        "❌ Insufficient balance for deployment (need at least 0.1 SOL)",
      );
      return;
    }

    // Load program IDL (assuming it's compiled)
    let idl, programId;
    try {
      idl = JSON.parse(fs.readFileSync("./target/idl/verm_staking.json"));
      const programIdFile = fs.readFileSync(
        "./target/deploy/verm_staking-keypair.json",
      );
      const programKeypair = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(programIdFile)),
      );
      programId = programKeypair.publicKey;
    } catch (error) {
      console.log("❌ Program not found. Please run: anchor build");
      return;
    }

    // Setup provider
    const provider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(deployerKeypair),
      { commitment: "confirmed" },
    );
    anchor.setProvider(provider);

    // Create program instance
    const program = new anchor.Program(idl, programId, provider);

    // Deploy configuration
    console.log("📋 Staking Contract Configuration:");
    console.log(`- VERM Token: ${VERM_TOKEN_MINT}`);
    console.log(`- Min Stake Period: 7 days`);
    console.log(`- Max Stake Period: 4 years`);
    console.log(`- Base APR: 3.69%`);
    console.log(`- Max APR: 36.9%`);

    // Find PDA for staking pool
    const [stakingPool] = PublicKey.findProgramAddressSync(
      [Buffer.from("staking_pool"), new PublicKey(VERM_TOKEN_MINT).toBuffer()],
      programId,
    );

    console.log(`📍 Staking Pool PDA: ${stakingPool.toBase58()}`);

    // Initialize staking pool
    console.log("🔧 Initializing staking pool...");

    const tx = await program.methods
      .initializePool(
        new anchor.BN(7 * 24 * 60 * 60), // 7 days minimum
        new anchor.BN(4 * 365 * 24 * 60 * 60), // 4 years maximum
        369, // 3.69% base APR (in basis points)
        3690, // 36.9% max APR (in basis points)
      )
      .accounts({
        stakingPool: stakingPool,
        tokenMint: new PublicKey(VERM_TOKEN_MINT),
        authority: deployerKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([deployerKeypair])
      .rpc();

    console.log(`✅ Staking pool initialized! Transaction: ${tx}`);

    // Save deployment info
    const deploymentInfo = {
      network: NETWORK,
      programId: programId.toBase58(),
      stakingPool: stakingPool.toBase58(),
      tokenMint: VERM_TOKEN_MINT,
      deployer: deployerKeypair.publicKey.toBase58(),
      deploymentTx: tx,
      timestamp: new Date().toISOString(),
      config: {
        minStakePeriod: "7 days",
        maxStakePeriod: "4 years",
        baseAPR: "3.69%",
        maxAPR: "36.9%",
      },
    };

    fs.writeFileSync(
      "./deployment-info.json",
      JSON.stringify(deploymentInfo, null, 2),
    );
    console.log("📄 Deployment info saved to deployment-info.json");

    console.log("\n🎉 VERM Staking Contract Successfully Deployed!");
    console.log("\n📋 Contract Details:");
    console.log(`Program ID: ${programId.toBase58()}`);
    console.log(`Staking Pool: ${stakingPool.toBase58()}`);
    console.log(
      `Transaction: https://solscan.io/tx/${tx}${NETWORK === "mainnet-beta" ? "" : "?cluster=devnet"}`,
    );

    console.log("\n🔗 Next Steps:");
    console.log("1. Update frontend with new contract addresses");
    console.log("2. Fund the staking pool with initial rewards");
    console.log("3. Test staking functionality");
    console.log("4. Set up monitoring and analytics");
  } catch (error) {
    console.error("❌ Deployment failed:", error);

    if (error.message.includes("insufficient funds")) {
      console.log("💰 Please add more SOL to the deployer account");
    } else if (error.message.includes("already initialized")) {
      console.log(
        "ℹ️  Contract already deployed, checking existing deployment...",
      );
    }
  }
}

// Run deployment
deployStakingContract().catch(console.error);
