# Chat Optimization - Message Persistence

## Problem
Previously, messages were being saved to storage on every token arrival during streaming. This was happening because of a `useEffect` hook that watched the `messages` state:

```tsx
// OLD APPROACH - Inefficient
useEffect(() => {
  const saveMessages = async () => {
    if (currentChatId && messages.length > 0) {
      await chatStorage.updateMessages(currentChatId, messages);
      const chats = await chatStorage.getAllChats()  ;
      setChatSessions(chats);
    }
  };
  saveMessages();
}, [messages, currentChatId]); // Triggered on every message change
```

This caused:
- Excessive storage writes during streaming
- Performance overhead
- Unnecessary re-renders and state updates

## Solution
Implemented the `onFinish` callback from `useChat` hook to save messages only when streaming is complete:

```tsx
// NEW APPROACH - Optimized
const { messages, ... } = useChat({
  // ... other config
  async onFinish({ messages: finishedMessages }) {
    // Save messages only when streaming is finished
    if (currentChatId && finishedMessages.length > 0) {
      await chatStorage.updateMessages(currentChatId, finishedMessages);
      const chats = await chatStorage.getAllChats();
      setChatSessions(chats);
    }
  },
});
```

## Benefits
- **Performance**: Reduces storage writes from hundreds (per token) to one (per message)
- **Efficiency**: Only saves the final, complete message
- **User Experience**: Smoother streaming without storage bottlenecks

## Reference
- `useChat` documentation: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
- Implementation: `src/sidepanel/ChatBotDemo.tsx:131-139`

## Date
2025-11-30
