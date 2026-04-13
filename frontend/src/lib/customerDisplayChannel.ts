const CHANNEL_NAME = 'mpos-customer-display';

export type DisplayOrderItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type DisplayMessage =
  | {
      type: 'UPDATE_ORDER';
      items: DisplayOrderItem[];
      subtotal: number;
      tax: number;
      discount: number;
      total: number;
    }
  | { type: 'PAYMENT_COMPLETE'; paid: number; change: number; method: string }
  | { type: 'CLEAR_ORDER' }
  | { type: 'STORE_INFO'; name: string; logo?: string };

export function sendToCustomerDisplay(message: DisplayMessage) {
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage(message);
  channel.close();
}

export function onCustomerDisplayMessage(
  callback: (msg: DisplayMessage) => void,
): () => void {
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (e) => callback(e.data);
  return () => channel.close();
}
