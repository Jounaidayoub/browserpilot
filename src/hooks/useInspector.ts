import { useState } from "react";
import { injectInspector } from "@/tools/Page";
import { services } from "@/services";

export function useInspector() {
  const [isInspecting, setIsInspecting] = useState(false);

  const inspect = async () => {
    setIsInspecting(true);
    try {
      console.log("starting:")
      const html = await injectInspector(services);
      console.log("got html ", html)
      return html;
    } finally {
      setIsInspecting(false);
    }
  };

  return { isInspecting, inspect } as const;
}

export default useInspector;
