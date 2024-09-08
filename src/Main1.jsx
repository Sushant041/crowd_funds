import React, { useState, useEffect } from "react";
import idl from "./idl.json";
import {
  PublicKey,
  clusterApiUrl,
  Connection,
  SystemProgram,
} from "@solana/web3.js";
import {
  AnchorProvider,
  BN,
  Program,
} from "@coral-xyz/anchor";
import { Buffer } from "buffer";
import Modal from 'react-modal'; // Make sure to install react-modal using 'npm install react-modal'

window.Buffer = Buffer;

const Main1 = ({ walletAddress, signTransaction }) => {
  const [campaigns, setCampaigns] = useState();
  const [activeTab, setActiveTab] = useState("myCampaigns");
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isDonateModalOpen, setDonateModalOpen] = useState(false);
  const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: "", description: "" });
  const [donationAmount, setDonationAmount] = useState(0.002);
  const [withdrawAmount, setWithdrawAmount] = useState(0.002);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const programId = new PublicKey(idl.address);
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const customStyles = {
    content: {
      backgroundColor : "black",      
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0)',
    },
  };

  useEffect(() => {
    if (walletAddress) {
      getCampaigns();
    }
  }, [walletAddress]);

  const getCampaigns = async () => {
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
      if (!walletAddress || !newCampaign.name || !newCampaign.description) {
        console.error("Invalid input.");
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
        .create(newCampaign.name, newCampaign.description)
        .accounts({
          campaign,
          user: new PublicKey(walletAddress),
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Created a new campaign w/ address:", campaign.toString());
      alert("Created a new campaign w/ address:" + campaign.toString());
      getCampaigns();
      setCreateModalOpen(false); // Close the modal after creation
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("Error creating campaign:" + error);
    }
  };

  const donate = async () => {
    try {
      if (!selectedCampaign || donationAmount < 0.002) {
        console.error("Invalid donation amount.");
        return;
      }

      const provider = new AnchorProvider(connection, {
        publicKey: new PublicKey(walletAddress),
        signTransaction,
      }, {
        commitment: "confirmed",
      });
      const program = new Program(idl, provider);

      await program.methods
        .donate(new BN(donationAmount * 1e9)) // Convert SOL to lamports (1 SOL = 1e9 lamports)
        .accounts({
          campaign: selectedCampaign,
          user: new PublicKey(walletAddress),
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Donated:", donationAmount, "to:", selectedCampaign.toString());
      getCampaigns();
      setDonateModalOpen(false);
    } catch (error) {
      console.error("Error donating:", error);
      alert("Error donating:" + error);
    }
  };

  const withdraw = async () => {
    try {
      if (!selectedCampaign || withdrawAmount < 0.002) {
        console.error("Invalid withdraw amount.");
        return;
      }

      const provider = new AnchorProvider(connection, {
        publicKey: new PublicKey(walletAddress),
        signTransaction,
      }, {
        commitment: "confirmed",
      });
      const program = new Program(idl, provider);

      await program.methods
        .withdraw(new BN(withdrawAmount * 1e9)) // Convert SOL to lamports (1 SOL = 1e9 lamports)
        .accounts({
          campaign: selectedCampaign,
          user: new PublicKey(walletAddress),
        })
        .rpc();

      console.log("Withdrew:", withdrawAmount, "from:", selectedCampaign.toString());
      getCampaigns();
      setWithdrawModalOpen(false);
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
      {campaigns && campaigns
        .filter((campaign) =>
          isOwnCampaigns
            ?  campaign.admin.toString() === walletAddress 
            : campaign.admin.toString() !== walletAddress
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
                onClick={() => {
                  setDonateModalOpen(true);
                  setSelectedCampaign(campaign.pubkey);
                }}
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
                  onClick={() => {
                    setWithdrawModalOpen(true);
                    setSelectedCampaign(campaign.pubkey);
                  }}
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
              onClick={() => {
                setActiveTab("myCampaigns")}}
              style={{
                padding: '12px 24px',
                border: '2px solid',
                width: "54%",
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
                width: "54%",
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
                onClick={() => setCreateModalOpen(true)}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#6366F1',
                  color: '#fff',
                  width: "100%",
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'background-color 0.3s ease',
                  marginBottom: '23px',
                  marginTop: "10px"
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

      {/* Create Campaign Modal */}
      <Modal style={customStyles} isOpen={isCreateModalOpen} onRequestClose={() => setCreateModalOpen(false)}>
      <div style={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"}}>
        <h2>Create Campaign</h2>
          <form className="dark bg-gray-900 flex flex-col">
            <label style={{width: "100%", display: "flex", alignItems: "center"}}>
              <span>Campaign Name:</span>
              <input
                type="text"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              />
            </label>
            <label style={{width: "100%", display: "flex", alignContent: "center"}}>
              <span>Campaign Description:</span>
              <textarea
                value={newCampaign.description}
                onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
              />
            </label>
            <div className="flex">
              <button type="button"
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#6366F1',
                  color: '#fff',
                  width: "100%",
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'background-color 0.3s ease',
                  marginBottom: '23px',
                  marginTop: "10px"
                }}
                onClick={createCampaign}>Create</button>
              <button type="button"
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#6366F1',
                  color: 'red',
                  width: "100%",
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'background-color 0.3s ease',
                  marginBottom: '23px',
                  marginTop: "10px"
                }}
                onClick={() => setCreateModalOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Donate Modal */}
      <Modal style={customStyles} isOpen={isDonateModalOpen} onRequestClose={() => setDonateModalOpen(false)}>
      <div style={{display: "flex", flexDirection: "column", justifyContent: "center", alignContent: "center"}}>          <h2>Donate to Campaign</h2>
          <form className="bg-gray-900 dark flec flex-col">
          <label style={{width: "100%", display: "flex", alignContent: "center"}}>
              <span>Donation Amount (Minimum 0.002 SOL):</span>
              <input
                type="number"
                value={donationAmount}
                onChange={(e) => setDonationAmount(Number(e.target.value))}
                min="0.002"
              />
            </label>
            <div className="flex">
              <button type="button"
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#6366F1',
                  color: '#fff',
                  width: "100%",
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'background-color 0.3s ease',
                  marginBottom: '23px',
                  marginTop: "10px"
                }} onClick={donate}>Donate</button>
              <button type="button"
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#6366F1',
                  color: 'red',
                  width: "100%",
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'background-color 0.3s ease',
                  marginBottom: '23px',
                  marginTop: "10px"
                }} onClick={() => setDonateModalOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal style={customStyles} isOpen={isWithdrawModalOpen} onRequestClose={() => setWithdrawModalOpen(false)}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignContent: "center"}}>
          <h2>Withdraw from Campaign</h2>
          <form className="dark bg-gray-900">
          <label style={{width: "100%", display: "flex", alignContent: "center"}}>
              Withdrawal Amount (Minimum 0.002 SOL):
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                min="0.002"
              />
            </label>
            <div className="flex">
              <button type="button"
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#6366F1',
                  color: '#fff',
                  width: "100%",
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'background-color 0.3s ease',
                  marginBottom: '23px',
                  marginTop: "10px"
                }} onClick={withdraw}>Withdraw</button>
              <button type="button"
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#6366F1',
                  color: 'red',
                  width: "100%",
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'background-color 0.3s ease',
                  marginBottom: '23px',
                  marginTop: "10px"
                }} onClick={() => setWithdrawModalOpen(false)}>Cancel</button>

            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Main1;
