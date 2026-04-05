import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
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
import { currentcontext } from "@/tools/utils";
import { type ChatSession } from "@/lib/storage";
import {
  type ModelOption,
  type ProviderId,
  DEFAULT_MODEL_OPTION,
  getAvailableModels,
  MODELS_API_URL,
  SUPPORTED_PROVIDERS,
} from "@/features/chat/config/models";
import { DEFAULT_SERVER_URL } from "@/lib/serverConfig";

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
  model: ModelOption;
  setModel: (option: ModelOption) => void;
  availableModels: ModelOption[];


  webSearch: boolean;
  setWebSearch: (value: boolean) => void;

  // Sidebar
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

const ChatAgentContext = createContext<ChatAgentAPI | null>(null);

export interface ChatAgentProviderProps {
  children: ReactNode;
  /** Override the default model option */
  defaultModel?: ModelOption;
  /** Override the API endpoint */
  apiUrl?: string;
}


export function ChatAgentProvider({
  children,
  defaultModel = DEFAULT_MODEL_OPTION,
  apiUrl = `${DEFAULT_SERVER_URL}/api/chat`,
}: ChatAgentProviderProps) {

  // console.log("ChatAgentProvider render ");
  const { isProviderConnected } = useProviderStatus();

  const [model, setModel] = useState<ModelOption>(defaultModel);
  const [webSearch, setWebSearch] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dynamicModels, setDynamicModels] = useState<ModelOption[]>([]);

  useEffect(() => {
    console.log("Fetching models from API...");
    async function fetchModels() {
      try {
        const response = await fetch(MODELS_API_URL);
        const data = await response.json();
        const transformed: ModelOption[] = [];

        for (const providerKey of SUPPORTED_PROVIDERS) {
          const providerData = data[providerKey];
          if (providerData && providerData.models) {
            Object.values(providerData.models).forEach((modelInfo: any) => {
              transformed.push({
                name: modelInfo.name,
                value: modelInfo.id,
                provider: providerKey as ProviderId,
              });
            });
          }
        }

        if (transformed.length > 0) {
          setDynamicModels(transformed);
        }
      } catch (error) {
        console.error("Failed to fetch models from models.dev:", error);
      }
    }
    fetchModels();
  }, []);

  const availableModels = useMemo(() => {
    const baseModels = getAvailableModels(isProviderConnected);
    // If we have dynamic models, we use them, otherwise fallback to defaults
    return dynamicModels.length > 0 ? dynamicModels : baseModels;
  }, [dynamicModels, isProviderConnected]);


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
      // TODO: find the write types , (there us a hard coded type in utils.ts for the addToolResult callback) , the ai sdk probaly changed this function 
      // check ai sdk v6 docums addtoolresult for the right type  
      evaluateToolCall(toolCall, addToolResult);
    },
    onFinish: saveMessagesToStorage,
  });

  const submit = useCallback(
    async (message: { text?: string; files?: FileUIPart[] }) => {
      const hasText = Boolean(message.text);
      const hasAttachments = Boolean(message.files?.length);
      if (!(hasText || hasAttachments)) return;

      // Create a new session if needed
      if (!currentChatId) {
        await createNewChat(message.text || "Sent with attachments", model.value, model.provider);
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
            model: model.value,
            providerId: model.provider,
            webSearch,
            currentcontext: currentcontextData,
          },
        },
      );
    },
    [

      currentChatId,
      createNewChat,
      model,
      webSearch,
      sendMessage,
    ],
  );

  const newChat = useCallback(() => {
    clearCurrentChat(setMessages);
    setIsSidebarOpen(false);
  }, [clearCurrentChat, setMessages]);

  const selectChat = useCallback(
    async (chatId: string) => {
      await selectChatRaw(chatId, setMessages, setModel, availableModels);
      setIsSidebarOpen(false);
    },
    [selectChatRaw, setMessages, availableModels],
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
