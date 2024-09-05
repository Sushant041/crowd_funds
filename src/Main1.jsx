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
import { Keypair } from "@solana/web3.js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

window.Buffer = Buffer;

// Dummy data for campaigns
const dummyCampaigns = [
  {
    pubkey: "Campaign1PublicKey",
    name: "Campaign 1",
    description: "This is the first campaign",
    amountDonated: 0.5 * 1e9, // 0.5 SOL in lamports
    admin: "WalletAddress1",
  },
  {
    pubkey: "Campaign2PublicKey",
    name: "Campaign 2",
    description: "This is the second campaign",
    amountDonated: 1.2 * 1e9, // 1.2 SOL in lamports
    admin: "WalletAddress2",
  },
  {
    pubkey: "Campaign3PublicKey",
    name: "Campaign 3",
    description: "This is the third campaign",
    amountDonated: 0.8 * 1e9, // 0.8 SOL in lamports
    admin: "Bq4vEPkVRGqo6j5DoBVWHA3YaoDYVtqUHaBZVbdK2efN",
  },
];

const Main1 = ({ walletAddress, signTransaction }) => {
  const [campaigns, setCampaigns] = useState(dummyCampaigns);
  const [activeTab, setActiveTab] = useState("myCampaigns");
  const programId = new PublicKey(idl.address);
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  useEffect(() => {
    if (walletAddress) {
      getCampaigns();
    }
  }, [walletAddress]);

  const getCampaigns = async () => {
    try {
      const provider = new AnchorProvider(connection, {
        publicKey: new PublicKey(walletAddress),
        signTransaction,
      }, {
        commitment: "confirmed",
      });
      const program = new Program(idl, provider);

      const campaignAccounts = await connection.getProgramAccounts(programId);
      const fetchedCampaigns = await Promise.all(
        campaignAccounts.map(async (campaign) => ({
          ...(await program.account.campaign.fetch(campaign.pubkey)),
          pubkey: campaign.pubkey,
        }))
      );

      setCampaigns(fetchedCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  const createCampaign = async () => {
    try {
      const testWallet = Keypair.generate();
      console.log(testWallet.publicKey.toString());

      const provider = new AnchorProvider(
        connection,
        {
          publicKey: testWallet.publicKey,
          signTransaction: async (tx) => {
            tx.partialSign(testWallet);
            return tx;
          },
          signAllTransactions: async (txs) => {
            txs.forEach((tx) => tx.partialSign(testWallet));
            return txs;
          },
        },
        { commitment: "confirmed" }
      );

      const program = new Program(idl, provider);

      const [campaign] = PublicKey.findProgramAddressSync(
        [Buffer.from("CAMPAIGN_DEMO"), testWallet.publicKey.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .create("campaign name", "campaign description")
        .accounts({
          campaign,
          user: testWallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = testWallet.publicKey;

      const signedTx = await provider.wallet.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize());

      await connection.confirmTransaction(signature);

      console.log("Created a new campaign w/ address:", campaign.toString());
      alert("Created a new campaign w/ address:" + campaign.toString());
      getCampaigns();
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("Error creating campaign:" + error);
    }
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
      console.error("Error donating:", error);
      alert("Error donating:" + error);
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
      console.error("Error withdrawing:", error);
      alert("Error withdrawing:" + error);
    }
  };

  const renderCampaigns = (isOwnCampaigns) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {isOwnCampaigns && (
        <div style={{ width: '100%', maxWidth: '800px', textAlign: 'center', marginBottom: '16px', color: '#fff' }}>
          <p style={{ color: '#ccc' }}>
            Note: You can only create a campaign once per account.
          </p>
        </div>
      )}
      {campaigns
        .filter((campaign) =>
          isOwnCampaigns
            ? campaign.admin === walletAddress
            : campaign.admin !== walletAddress
        )
        .map((campaign) => (
          <div key={campaign.pubkey.toString()} style={{
            width: '100%',
            maxWidth: '800px',
            border: '1px solid grey',
            borderRadius: '8px',
            padding: '16px',
            margin: '16px 0',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            backgroundColor: "#1C212E",
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              marginBottom: '48px',
              textAlign: 'left'
            }}>
              <h3 style={{
                margin: '0 0 8px',
                color: '#00BCD4'
              }}>{campaign.name}</h3>
              <p style={{ margin: '4px 0', color: '#ccc' }}>
                <strong>Description:</strong> {campaign.description}
              </p>
              <p style={{ margin: '4px 0', color: '#ccc' }}>
                <strong>Balance:</strong> {(campaign.amountDonated / 1e9).toFixed(2)} SOL
              </p>
              <p style={{ margin: '4px 0', color: '#ccc' }}>
                <strong>Admin:</strong> {campaign.admin.toString()}
              </p>
            </div>
            <div style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={() => donate(campaign.pubkey)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#6366F1',
                  color: '#fff',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'background-color 0.3s ease'
                }}
              >
                Donate
              </button>
              {campaign.admin.toString() === walletAddress && (
                <button
                  onClick={() => withdraw(campaign.pubkey)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: '#6366F1',
                    color: '#fff',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    transition: 'background-color 0.3s ease'
                  }}
                >
                  Withdraw
                </button>
              )}
            </div>
          </div>
        ))}
    </div>
  );
  
  

  return (
    <div style={{ padding: '16px' }}>
      {walletAddress ? (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '16px',
            gap: '16px'
          }}>
            <button
              onClick={() => setActiveTab("myCampaigns")}
              style={{
                padding: '12px 24px',
                border: '2px solid',
                width:"54%",
                borderColor: activeTab === "myCampaigns" ? '#00BCD4' : '#1C212E',
                backgroundColor: activeTab === "myCampaigns" ? '#1C212E' : '#2F3C57',
                color: activeTab === "myCampaigns" ? '#00BCD4' : '#fff',
                cursor: 'pointer',
                fontWeight: activeTab === "myCampaigns" ? 'bold' : 'normal',
                transition: 'all 0.3s ease'
              }}
            >
              My Campaigns
            </button>
            <button
              onClick={() => setActiveTab("otherCampaigns")}
              style={{
                padding: '12px 24px',
                border: '2px solid',
                width:"54%",
                borderColor: activeTab === "otherCampaigns" ? '#00BCD4' : '#1C212E',
                backgroundColor: activeTab === "otherCampaigns" ? '#1C212E' : '#2F3C57',
                color: activeTab === "otherCampaigns" ? '#00BCD4' : '#fff',
                cursor: 'pointer',
                fontWeight: activeTab === "otherCampaigns" ? 'bold' : 'normal',
                transition: 'all 0.3s ease'
              }}
            >
              Other Campaigns
            </button>
          </div>
          {activeTab === "myCampaigns" && (
            <div>
              <button
                onClick={createCampaign}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#6366F1',
                  color: '#fff',
                  width:"100%",
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'background-color 0.3s ease',
                  marginBottom: '23px',
                  marginTop:"10px"
                }}
              >
                Create Campaign +
              </button>
              {renderCampaigns(true)}
            </div>
          )}
          {activeTab === "otherCampaigns" && renderCampaigns(false)}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default Main1;
