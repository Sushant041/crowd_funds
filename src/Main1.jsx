import React, { useState, useEffect } from "react";
import idl from "./idl.json";
import {
  PublicKey,
  clusterApiUrl,
  Connection,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  AnchorProvider,
  BN,
  Program,
} from "@coral-xyz/anchor";
import { Buffer } from "buffer";

window.Buffer = Buffer;

const Main1 = ({ walletAddress, signTransaction }) => {
  const [campaigns, setCampaigns] = useState([]);
  const programId = new PublicKey(idl.address);

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  useEffect(() => {
    if (walletAddress) {
      getCampaigns();
    }
  }, [walletAddress]);

  const createCampaign = async () => {
    try {
      if (!walletAddress) {
        console.error("Wallet not connected.");
        return;
      }

      const provider = new AnchorProvider(connection, {
        publicKey: new PublicKey(walletAddress),
        signTransaction,
      }, {
        commitment: "confirmed",
      });

      const program = new Program(idl, provider);

      const [campaign] = PublicKey.findProgramAddressSync(
        [Buffer.from("CAMPAIGN_DEMO"), new PublicKey(walletAddress).toBuffer()],
        program.programId
      );

      await program.methods
        .create("campaign name", "campaign description")
        .accounts({
          campaign,
          user: new PublicKey(walletAddress),
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Created a new campaign w/ address:", campaign.toString());
      alert("Created a new campaign w/ address:" + campaign.toString());
      getCampaigns();

    } catch (error) {
      console.error("Error creating campaign account:", error);
      alert("Error creating campaign account:" + error);
    }
  };

  const getCampaigns = async () => {
    const provider = new AnchorProvider(connection, {
      publicKey: new PublicKey(walletAddress),
      signTransaction,
    }, {
      commitment: "confirmed",
    });
    const program = new Program(idl, provider);

    const campaignAccounts = await connection.getProgramAccounts(programId);
    const campaigns = await Promise.all(
      campaignAccounts.map(async (campaign) => ({
        ...(await program.account.campaign.fetch(campaign.pubkey)),
        pubkey: campaign.pubkey,
      }))
    );
    setCampaigns(campaigns);
  };

  const donate = async (publicKey) => {
    try {
      const provider = new AnchorProvider(connection, {
        publicKey: new PublicKey(walletAddress),
        signTransaction,
      }, {
        commitment: "confirmed",
      });
      const program = new Program(idl, provider);

      await program.methods
        .donate(new BN(0.2 * 1e9)) // Convert SOL to lamports (1 SOL = 1e9 lamports)
        .accounts({
          campaign: publicKey,
          user: new PublicKey(walletAddress),
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Donated some money to:", publicKey.toString());
      getCampaigns();
      alert("Donated some money to:" + publicKey.toString());
    } catch (error) {
      alert("Error donating:" + error);
      console.error("Error donating:", error);
    }
  };

  const withdraw = async (publicKey) => {
    try {
      const provider = new AnchorProvider(connection, {
        publicKey: new PublicKey(walletAddress),
        signTransaction,
      }, {
        commitment: "confirmed",
      });
      const program = new Program(idl, provider);

      await program.methods
        .withdraw(new BN(0.2 * 1e9)) // Convert SOL to lamports (1 SOL = 1e9 lamports)
        .accounts({
          campaign: publicKey,
          user: new PublicKey(walletAddress),
        })
        .rpc();

      console.log("Withdrew some money from:", publicKey.toString());
      getCampaigns();
      alert("Withdrew some money from:" + publicKey.toString());
    } catch (error) {
      alert("Error withdrawing:" + error);
      console.error("Error withdrawing:", error);
    }
  };

  const renderConnectedContainer = () => (
    <>
      <button onClick={createCampaign}>Create a campaign…</button>
      <div>
        <h2>Campaigns</h2>
        <ul>
          {campaigns?.map((campaign) => (
            <li key={campaign.pubkey.toString()}>
              <p>Pubkey: {campaign.pubkey.toString()}</p>
              <p>Name: {campaign.name}</p>
              <p>Description: {campaign.description}</p>
              <p>
                Balance:{" "}
                {(campaign.amountDonated / 1e9).toFixed(2)} SOL
              </p>
              <p>Admin: {campaign.admin.toString()}</p>
              <button onClick={() => donate(campaign.pubkey)}>Donate</button>
              {campaign.admin.toString() === walletAddress && (
                <button onClick={() => withdraw(campaign.pubkey)}>
                  Withdraw
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );

  return (
    <div>
      {walletAddress ? renderConnectedContainer() : <p>Please connect your wallet.</p>}
    </div>
  );
};

export default Main1;
