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
import { Inspect } from "lucide-react";
import React, { useRef } from "react";
import useInspector from "@/hooks/useInspector";
import { useChatAgent } from "@/features/chat/context/ChatAgentContext";

export const ChatPromptInput = React.memo(() => {
  const {
    input,
    setInput,
    submit: handleSubmit,
    status,
    stop,
    model,
    setModel,
    availableModels: models,
  } = useChatAgent();

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
});
