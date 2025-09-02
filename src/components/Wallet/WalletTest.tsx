import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';

export function WalletTest() {
  const account = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

  async function signTest() {
    const bytes = new TextEncoder().encode('hello from my custom site');
    const { signature } = await signPersonalMessage({ message: bytes });
    alert(`Signed!\nAddress: ${account?.address}\nSignature (base64): ${signature}`);
  }

  async function signAndRecordOnChain() {
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const message = 'hello from my custom site - recorded on chain';
      const bytes = new TextEncoder().encode(message);
      
      // First sign the message
      const { signature } = await signPersonalMessage({ message: bytes });
      
      // For now, we'll just show the signature and explain the concept
      // In a real implementation, you would:
      // 1. Create a Move transaction using TransactionBlock
      // 2. Call a custom Move function that stores the signature data
      // 3. Execute the transaction to record it on-chain
      
      alert(`Message signed successfully!\n\nTo record on-chain, you would need to:\n1. Create a Move transaction\n2. Store the signature in a custom object\n3. Execute the transaction\n\nCurrent signature: ${signature}`);
      
      console.log('Message signed:', {
        message,
        signature,
        address: account.address,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error signing message:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to sign message'}`);
    }
  }

  return (
    <div className="p-6 bg-white/5 rounded-lg border border-gray-200/20">
      <h1 className="text-2xl font-semibold mb-2 text-white">Slush login demo</h1>
      <p className="mb-4 text-gray-300">
        Click "Connect", choose <b>Slush</b>, then optionally run a quick sign test.
      </p>

      <div className="flex gap-3">
        <button
          onClick={signTest}
          disabled={!account}
          className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          Sign message test
        </button>

        <button
          onClick={signAndRecordOnChain}
          disabled={!account}
          className="px-3 py-2 rounded bg-green-600 text-white disabled:opacity-50 hover:bg-green-700 transition-colors"
        >
          Sign & Show On-Chain Concept
        </button>
      </div>
      
      {account && (
        <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded">
          <p className="text-green-400 text-sm">Connected to: {account.address}</p>
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded">
        <h3 className="text-blue-400 font-semibold mb-2">On-Chain Recording Concept</h3>
        <p className="text-blue-300 text-sm">
          To actually record signatures on-chain, you would need to:
        </p>
        <ul className="text-blue-300 text-sm mt-2 list-disc list-inside space-y-1">
          <li>Create a custom Move module with a function to store signature data</li>
          <li>Use TransactionBlock to create a transaction calling that function</li>
          <li>Pass the signature, message, and metadata as transaction arguments</li>
          <li>Execute the transaction to permanently store the data on-chain</li>
        </ul>
      </div>
    </div>
  );
}
