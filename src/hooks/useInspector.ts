import { useState } from "react";
import { injectInspector } from "@/tools/Page";

export function useInspector() {
  const [isInspecting, setIsInspecting] = useState(false);

  const inspect = async () => {
    setIsInspecting(true);
    try {
      console.log("staring:")
      const html = await injectInspector();
      console.log("got html ",html)
      return html;
    } finally {
      setIsInspecting(false);
    }
  };

  return { isInspecting, inspect } as const;
}

export default useInspector;
