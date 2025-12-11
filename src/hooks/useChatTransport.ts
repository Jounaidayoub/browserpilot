import { evaluateToolCall } from "@/sidepanel/evaluator";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";

type UseChatTransportOpts = {
  transportUrl?: string;
  onFinish?: (args: { messages: UIMessage[] }) => Promise<void> | void;
};

export function useChatTransport(opts: UseChatTransportOpts = {}) {
  const transportApi =
    opts.transportUrl || (import.meta as any)?.env?.VITE_CHAT_TRANSPORT ||
    "http://localhost:8080/";

  const { onFinish } = opts;

  const {
    messages,
    sendMessage,
    status,
    regenerate,
    addToolResult,
    stop,
    error,
    setMessages,
  } = useChat({
    transport: new DefaultChatTransport({ api: transportApi }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,

    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) return;
      evaluateToolCall(toolCall, addToolResult);
    },

    async onFinish(args) {
      if (onFinish) await onFinish(args as { messages: UIMessage[] });
    },
  });

  return {
    messages,
    sendMessage,
    status,
    regenerate,
    addToolResult,
    stop,
    error,
    setMessages,
  } as const;
}

export default useChatTransport;
