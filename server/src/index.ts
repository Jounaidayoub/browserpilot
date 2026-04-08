import { startServer } from "./server";
import { isDebugEnabled, setLogLevel } from "./lib/logger";

setLogLevel(isDebugEnabled());
startServer();
