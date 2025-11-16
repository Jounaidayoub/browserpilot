import { ZodError } from "zod";


export const formatZodIssues = (error: ZodError) => error.issues
  .map((issue) => {
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  })
  .join("; ");
