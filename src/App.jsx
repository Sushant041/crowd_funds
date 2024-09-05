import { useState, FC, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { CanvasWalletProvider } from './CanvasWalletProvider';
import WalletComponent from './WalletComponent';
import Main1 from './Main1';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const App = () => {
  // const [count, setCount] = useState(0);
  // useEffect(() => {
  //   if (1) {
  //     toast.success(`You clicked ${count} times`);
  //   }
  // }
  // , [count]);

  return (
    <CanvasWalletProvider>
      
      <div >
      
        <WalletComponent />
        
      </div>
     
      <div>
        <Main1 />
        <ToastContainer />
      </div>
    </CanvasWalletProvider>
  );
};
