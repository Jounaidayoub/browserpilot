import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { GlobeIcon, Inspect } from "lucide-react";
import { useRef } from "react";
import useInspector from "@/hooks/useInspector";
import { ChatStatus } from "ai";
import {  Button} from "@/components/ui/button";

interface ChatPromptInputProps {
  input: string;
  setInput: (input: string) => void;
  handleSubmit: (message: PromptInputMessage) => void;
  status: ChatStatus;
  stop: () => void;
  webSearch: boolean;
  setWebSearch: (webSearch: boolean) => void;
  model: string;
  setModel: (model: string) => void;
  models: { name: string; value: string }[];
}

export const ChatPromptInput = ({
  input,
  setInput,
  handleSubmit,
  status,
  stop,
  webSearch,
  setWebSearch,
  model,
  setModel,
  models,
}: ChatPromptInputProps) => {
  const promptInput = useRef<HTMLTextAreaElement>(null);
  const { isInspecting, inspect } = useInspector();

  const handleInspect = async () => {
    const elementHTML = await inspect();
    const inspectPrompt = `\n\nInspected element:\n\n ${elementHTML}`;
    const newInput = input + inspectPrompt;
    setInput(newInput);

    if (promptInput.current) {
      promptInput.current.focus();
    }
  };

  return (
    <PromptInput onSubmit={handleSubmit} className="bg-secondary shadow-2xl rounded-2xl border-2 border-primary/20" globalDrop multiple>
      <PromptInputBody>
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachment data={attachment} />}
        </PromptInputAttachments>
        <PromptInputTextarea
          onChange={(e) => {
            setInput(e.target.value);
          }}
          value={input}
          autoFocus
          ref={promptInput}
        />
      </PromptInputBody>
      <PromptInputToolbar>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
          <PromptInputButton
            onClick={handleInspect}
            disabled={isInspecting}
            size={"icon-sm"}
          >
            <Inspect className=" size-4" />
          </PromptInputButton>
          <PromptInputModelSelect
            onValueChange={(value) => {
              setModel(value);
            }}
            value={model}
          >
            <PromptInputModelSelectTrigger>
              <PromptInputModelSelectValue />
            </PromptInputModelSelectTrigger>
            <PromptInputModelSelectContent>
              {models.map((model) => (
                <PromptInputModelSelectItem
                  key={model.value}
                  value={model.value}
                >
                  {model.name}
                </PromptInputModelSelectItem>
              ))}
            </PromptInputModelSelectContent>
          </PromptInputModelSelect>
        </PromptInputTools>
        <PromptInputSubmit
          className="btn-primary"
          disabled={!input && !status}
          status={status}
          onClick={stop}
        />
      </PromptInputToolbar>
    </PromptInput>
  );
};
