export const quickWebSocketCheck = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(url);

      // Quick timeout - don't wait too long
      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 1000); // Just 1 second

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };

      ws.onclose = () => {
        clearTimeout(timeout);
        resolve(false);
      };
    } catch (error) {
      resolve(false);
    }
  });
};

export default quickWebSocketCheck;
