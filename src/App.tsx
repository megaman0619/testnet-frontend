import { createDefaultAuthorizationResultCache, SolanaMobileWalletAdapter } from '@solana-mobile/wallet-adapter-mobile';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, useAnchorWallet, useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
    GlowWalletAdapter,
    PhantomWalletAdapter,
    SlopeWalletAdapter,
    SolflareWalletAdapter,
    TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, Commitment, Connection } from '@solana/web3.js';
import React, { FC, ReactNode, useMemo, useState } from 'react';
import * as anchor from '@project-serum/anchor'
import { IDL } from '../src/constants/demo_project';
import { PROGRAM_ID, DECIMAL } from './config';

require('./App.css');

require('@solana/wallet-adapter-react-ui/styles.css');
const App: FC = () => {
    return (
        <Context>
            <Content />
        </Context>
    );
};
export default App;

const Context: FC<{ children: ReactNode }> = ({ children }) => {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    const network = WalletAdapterNetwork.Testnet;

    // You can also provide a custom RPC endpoint.
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
    // Only the wallets you configure here will be compiled into your application, and only the dependencies
    // of wallets that your users connect to will be loaded.
    const wallets = useMemo(
        () => [
            new SolanaMobileWalletAdapter({
                appIdentity: { name: 'Solana Create React App Starter App' },
                authorizationResultCache: createDefaultAuthorizationResultCache(),
            }),
            new PhantomWalletAdapter(),
            new GlowWalletAdapter(),
            new SlopeWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            new TorusWalletAdapter(),
        ],
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

const { SystemProgram, Keypair } = anchor.web3;
/* create an account  */
const baseAccount = Keypair.generate();

const Content: FC = () => {
    const [value, setValue] = useState('');
    const wallet = useAnchorWallet();
    const network = "http://127.0.0.1:8899";
    const connection = new Connection(network, 'processed');
    const getProvider = async() => {


        const provider = new anchor.AnchorProvider(
        connection, wallet as anchor.Wallet, 'processed' as anchor.web3.ConfirmOptions
        );
        return provider;
    }

    const createCounter = async() => {    
        const provider = await getProvider()
        /* create the program interface combining the idl, program ID, and provider */
        const program = new anchor.Program(IDL, PROGRAM_ID, provider);
        try {
          const balance = await connection.getBalance(wallet!.publicKey) / DECIMAL;
          const result = await program.methods.initialize()
          .accounts({
              baseAccount: baseAccount.publicKey,
              user: provider.wallet.publicKey,
              systemProgram: SystemProgram.programId,
          }).signers([baseAccount]).rpc();
          const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
          console.log('account: ', account);
          setValue(account.count.toString());
        } catch (err) {
          console.log("Transaction error: ", err);
        }
      }

      const increment = async () => {
        const provider = await getProvider();
        const program = new anchor.Program(IDL, PROGRAM_ID, provider);
        const result = program.methods.increment().accounts({
            baseAccount: baseAccount.publicKey
        })
        const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
        console.log('account: ', account);
        setValue(account.count.toString());
      }

      if (!wallet) {
        /* If the user's wallet is not connected, display connect wallet button. */
        return (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop:'100px' }}>
            <WalletMultiButton />
          </div>
        )
      } else {
        return (
          <div className="App">
            <div>
              {
                !value && (<button onClick={createCounter}>Create counter</button>)
              }
              {
                value && <button onClick={increment}>Increment counter</button>
              }
    
              {
                value && Number(value) >= Number(0) ? (
                  <h2>{value}</h2>
                ) : (
                  <h3>Please create the counter.</h3>
                )
              }
            </div>
          </div>
        );
      }
};
