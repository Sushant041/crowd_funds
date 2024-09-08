import { FC } from "react";
import useCanvasWallet from "./CanvasWalletProvider";
import UserProfile from "./UserProfile"; // Ensure the correct path to UserProfile
import Main1 from "./Main1"; // Import Main1 component

const WalletComponent = () => {
  const { connectWallet, walletAddress, walletIcon, userInfo, content, signTransaction ,} =
    useCanvasWallet();

   
  return (
    <div>
      {
        !walletAddress && (<>
          <p> 

    <dotlottie-player src="https://lottie.host/50ced29f-5404-4fc8-8a8b-68bf2a714a14/JJ0z0rck4b.json" background="transparent" speed="1" style={{height:"100px"}} loop autoplay></dotlottie-player></p>
          <button onClick={connectWallet} style={{backgroundColor:"#6366F1"}}>Connect Solana Wallet</button>
          </> )
      }

      {userInfo && walletAddress && (
        <div>
          {userInfo.username && <UserProfile username={userInfo.username} walletAddress={walletAddress||"N/A"}  avatar={userInfo.avatar}/>}
        </div>
      )}


      {walletAddress && signTransaction && (
        <Main1 walletAddress={walletAddress} signTransaction={signTransaction } />
      )}
    </div>
  );
};

export default WalletComponent;
