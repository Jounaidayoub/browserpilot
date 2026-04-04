import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
  type ChatStatus,
  type FileUIPart,
} from "ai";
import { evaluateToolCall } from "@/sidepanel/evaluator";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useProviderStatus } from "@/hooks/useProviderStatus";
import { useAuth } from "@/lib/auth-context";
import { currentcontext } from "@/tools/utils";
import { type ChatSession } from "@/lib/storage";
import {
  type ModelOption,
  DEFAULT_MODEL_VALUE,
  getAvailableModels,
  resolveProvider,
} from "@/features/chat/config/models";

export interface ChatAgentAPI {
  messages: UIMessage[];
  status: ChatStatus;
  error: Error | undefined;

  // Actions
  submit: (message: { text?: string; files?: FileUIPart[] }) => void;
  stop: () => void;
  regenerate: () => void;

  // Session management
  currentChatId: string | null;
  chatSessions: ChatSession[];
  isLoadingChat: boolean;
  newChat: () => void;
  selectChat: (id: string) => void;
  deleteChat: (id: string) => void;

  // Model & provider config
  model: string;
  setModel: (model: string) => void;
  availableModels: ModelOption[];

  // Input state (shared so prompt input and other UI stay in sync)
  input: string;
  setInput: (value: string) => void;
  webSearch: boolean;
  setWebSearch: (value: boolean) => void;

  // Sidebar
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

const ChatAgentContext = createContext<ChatAgentAPI | null>(null);

export interface ChatAgentProviderProps {
  children: ReactNode;
  /** Override the default model value */
  defaultModel?: string;
  /** Override the API endpoint */
  apiUrl?: string;
}


export function ChatAgentProvider({
  children,
  defaultModel = DEFAULT_MODEL_VALUE,
  apiUrl = "http://localhost:8080/api/chat",
}: ChatAgentProviderProps) {
  const { isAuthenticated, triggerAuthDialog } = useAuth();
  const { isconnected } = useProviderStatus();

  const [input, setInput] = useState("");
  const [model, setModelRaw] = useState(defaultModel);
  const [webSearch, setWebSearch] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const availableModels = useMemo(
    () => getAvailableModels(isconnected),
    [isconnected],
  );

  const providerId = useMemo(
    () => resolveProvider(model, availableModels),
    [model, availableModels],
  );

  const setModel = useCallback(
    (newModel: string) => {
      setModelRaw(newModel);
    },
    [],
  );

  const {
    currentChatId,
    chatSessions,
    isLoadingChat,
    saveMessagesToStorage,
    createNewChat,
    selectChat: selectChatRaw,
    deleteChat: deleteChatRaw,
    clearCurrentChat,
  } = useChatSessions();

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
    transport: new DefaultChatTransport({ api: apiUrl }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) return;
      evaluateToolCall(toolCall, (async (args: any) => {
        addToolResult(args);
      }) as any);
    },
    onFinish: saveMessagesToStorage,
  });

  const submit = useCallback(
    async (message: { text?: string; files?: FileUIPart[] }) => {
      const hasText = Boolean(message.text);
      const hasAttachments = Boolean(message.files?.length);
      if (!(hasText || hasAttachments)) return;

      // Auth gate
      if (!isAuthenticated) {
        triggerAuthDialog();
        return;
      }

      // Create a new session if needed
      if (!currentChatId) {
        await createNewChat(message.text || "Sent with attachments", model);
      }

      // Fetch browser context before sending
      const currentcontextData = await currentcontext();

      sendMessage(
        {
          text: message.text || "Sent with attachments",
          files: message.files,
        },
        {
          body: {
            model,
            providerId,
            webSearch,
            currentcontext: currentcontextData,
          },
        },
      );
      setInput("");
    },
    [
      isAuthenticated,
      triggerAuthDialog,
      currentChatId,
      createNewChat,
      model,
      providerId,
      webSearch,
      sendMessage,
    ],
  );

  const newChat = useCallback(() => {
    clearCurrentChat(setMessages);
    setInput("");
    setIsSidebarOpen(false);
  }, [clearCurrentChat, setMessages]);

  const selectChat = useCallback(
    async (chatId: string) => {
      await selectChatRaw(chatId, setMessages, setModelRaw);
      setIsSidebarOpen(false);
    },
    [selectChatRaw, setMessages],
  );

  const deleteChat = useCallback(
    async (chatId: string) => {
      await deleteChatRaw(chatId, newChat);
    },
    [deleteChatRaw, newChat],
  );

  const api = useMemo<ChatAgentAPI>(
    () => ({
      messages,
      status,
      error,
      submit,
      stop,
      regenerate,
      currentChatId,
      chatSessions,
      isLoadingChat,
      newChat,
      selectChat,
      deleteChat,
      model,
      setModel,
      availableModels,
      input,
      setInput,
      webSearch,
      setWebSearch,
      isSidebarOpen,
      setIsSidebarOpen,
    }),
    [
      messages,
      status,
      error,
      submit,
      stop,
      regenerate,
      currentChatId,
      chatSessions,
      isLoadingChat,
      newChat,
      selectChat,
      deleteChat,
      model,
      setModel,
      availableModels,
      input,
      webSearch,
      isSidebarOpen,
    ],
  );

  return (
    <ChatAgentContext.Provider value={api}>{children}</ChatAgentContext.Provider>
  );
}


export function useChatAgent(): ChatAgentAPI {
  const ctx = useContext(ChatAgentContext);
  if (!ctx) {
    throw new Error("useChatAgent must be used within a <ChatAgentProvider>");
  }
  return ctx;
}
