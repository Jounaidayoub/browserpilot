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
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  ModelSelector,
  ModelSelectorTrigger,
  ModelSelectorContent,
  ModelSelectorInput,
  ModelSelectorList,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorItem,
  ModelSelectorLogo,
  ModelSelectorName,
} from "@/components/ai-elements/model-selector";
import { Button } from "@/components/ui/button";
import { Inspect } from "lucide-react";
import React, { useRef, useState } from "react";
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
  const [openSelector, setOpenSelector] = useState(false);

  const handleInspect = async () => {
    const elementHTML = await inspect();
    const inspectPrompt = `\n\nInspected element:\n\n ${elementHTML}`;
    const newInput = input + inspectPrompt;
    setInput(newInput);

    if (promptInput.current) {
      promptInput.current.focus();
    }
  };

  const currentModelOption = models.find(m => m.value === model) || models[0] || { provider: "generic", name: "Unknown", value: "unknown" };

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
          
          <ModelSelector open={openSelector} onOpenChange={setOpenSelector}>
            <ModelSelectorTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-2 px-2 text-muted-foreground hover:text-foreground">
                 <ModelSelectorLogo provider={currentModelOption.provider} />
                 {currentModelOption.name}
              </Button>
            </ModelSelectorTrigger>
            <ModelSelectorContent title="Select a Model">
              <ModelSelectorInput placeholder="Search models..." />
              <ModelSelectorList>
                <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                <ModelSelectorGroup heading="Available Models">
                  {models.map((opt) => (
                    <ModelSelectorItem 
                       key={opt.value} 
                       value={opt.value} 
                       onSelect={(val) => { setModel(val); setOpenSelector(false); }}
                    >
                       <ModelSelectorLogo provider={opt.provider} className="mr-2" />
                       <ModelSelectorName>{opt.name}</ModelSelectorName>
                    </ModelSelectorItem>
                  ))}
                </ModelSelectorGroup>
              </ModelSelectorList>
            </ModelSelectorContent>
          </ModelSelector>
          
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
