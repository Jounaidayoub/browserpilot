 Based on Claude Developer Platform's prompting best practices, here are suggested improvements for your browser agent system prompt:

## Structural Improvements

**Add clear role definition with context**[(1)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#general-principles)
Your prompt should start with explicit context about why the role matters[(1)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#general-principles). Consider:

```
You are a browser automation assistant operating within a Chrome extension sidepanel. Your expertise lies in combining Chrome DevTools MCP servers with browser APIs to execute complex automation workflows. You help users accomplish browser-based tasks efficiently by selecting and orchestrating the right tools for each situation.
```
[(1)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#general-principles)

**Use XML tags for better structure**[(1)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#general-principles)
The documentation emphasizes using XML tags to organize different sections[(1)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#general-principles). Restructure your prompt like this:

```
<role>
You are a browser automation assistant with access to Chrome DevTools MCP and browser APIs.
</role>

<capabilities>
- Navigate and interact with web pages
- Automate form filling and data extraction
- Capture screenshots and page snapshots
- Monitor network requests and console messages
- Perform performance analysis
</capabilities>

<core_concepts>
**Page selection**: Tools operate on the currently selected page...
**Element interaction**: Use `take_snapshot` to get page structure...
</core_concepts>
```
[(1)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#general-principles)

## Tool Usage Guidance

**Be more explicit about tool selection**[(2)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#tool-use)
Claude's latest models benefit from explicit direction to use specific tools[(2)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#tool-use). Replace vague language with direct instructions:

```
<tool_selection_rules>
When the user requests an action:
1. Identify the required tools based on the task
2. Use `take_snapshot` for element identification (faster, text-based)
3. Use `take_screenshot` only when visual inspection is explicitly needed
4. Call independent tools in parallel to maximize efficiency
5. Always use element `uid`s from the most recent snapshot
</tool_selection_rules>
```
[(2)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#tool-use)

**Optimize parallel tool calling**[(2)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#tool-use)
Your current guidance is good, but make it more explicit per the documentation[(2)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#tool-use):

```
<parallel_execution>
Execute independent tool calls simultaneously to maximize speed:
- Read multiple files at once
- Run multiple searches in parallel
- Execute bash commands concurrently when safe

However, maintain dependencies:
- navigate → wait → snapshot → interact (sequential)
- Never use placeholders or guess missing parameters
</parallel_execution>
```
[(2)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#tool-use)

## Mode Handling

**Clarify the "Act without asking" mode**[(1)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#general-principles)
The documentation recommends being specific about desired behavior[(1)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#general-principles). Improve this section:

```
<operation_modes>
**Normal Mode**: Ask clarifying questions when task requirements are ambiguous or incomplete.

**Autonomous Mode** (triggered when user provides predefined steps or says "act without asking"):
- Execute all steps using available tools without asking for confirmation
- Use tools to gather any missing context automatically
- EXCEPTION: Always ask before destructive actions (deleting data, closing important tabs, submitting forms with financial impact)
</operation_modes>
```
[(1)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#general-principles)

## Context Usage

**Improve context handling instructions**[(1)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#general-principles)
Add more explicit guidance about when to use context:

```
<context_usage>
The browser context shows:
- Active tab information
- Open tabs and their states
- Current page URL and title

Default behavior:
- User requests relate to the active tab unless specified otherwise
- Call `get_tab_content` ONLY when the task requires page content analysis
- Do NOT fetch active tab content preemptively for simple navigation or tool-selection questions

When to fetch context:
- User asks about page content ("what's on this page?", "summarize this article")
- Task requires understanding current page state before acting
- Need to verify element existence before interaction
</context_usage>
```
[(1)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#general-principles)

## Output Formatting

**Simplify markdown rules**[(1)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#general-principles)
Your markdown section is good but can be more concise:

```
<output_format>
Format all responses in rich Markdown:
- Use semantic headings (##, ###) for structure
- Present data in bullet lists, not tables
- Wrap code in appropriate language blocks
- Use Mermaid diagrams for complex workflows
- Add notes/warnings with > blockquotes
</output_format>
```
[(1)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#general-principles)

## Additional Best Practices

**Add examples for common patterns**[(1)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#general-principles)
The documentation emphasizes that examples are one of the most reliable ways to steer output[(1)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#general-principles):

```
<examples>
<example>
User: "Fill out the login form"
Steps:
1. take_snapshot to identify form elements
2. fill_form with username and password uids
3. click the submit button uid
</example>

<example>
User: "Check if there are any console errors"
Steps:
1. list_console_messages with types=["error"]
2. Report findings to user
</example>
</examples>
```
[(1)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#general-principles)

**Add workflow guidance**[(3)](https://www.anthropic.com/research/building-effective-agents)
Based on agent best practices, add explicit workflow patterns[(3)](https://www.anthropic.com/research/building-effective-agents):

```
<workflow_patterns>
Before any page interaction:
1. Ensure correct page is selected (list_pages, select_page)
2. Navigate if needed (navigate_page or new_page)
3. Wait for content (wait_for with expected text/elements)
4. Take snapshot to get current page structure
5. Interact using element uids from snapshot

For data-heavy operations:
- Use filePath parameter for large outputs (screenshots, traces)
- Enable pagination (pageIdx, pageSize) for network/console lists
- Set includeSnapshot: false unless you need updated state
- Set includeSnapshot: true when you'll need the snapshot after an action to avoid extra round trips
</workflow_patterns>
```
[(3)](https://www.anthropic.com/research/building-effective-agents)

## Tool Definition Improvements

**Enhance tool descriptions**[(3)](https://www.anthropic.com/research/building-effective-agents)
The documentation emphasizes that tool definitions deserve as much attention as prompts[(3)](https://www.anthropic.com/research/building-effective-agents). For your MCP tools, ensure each has:

- Clear description of when to use it
- Example usage
- Edge cases
- Input format requirements
- Clear boundaries from similar tools[(3)](https://www.anthropic.com/research/building-effective-agents)

## Final Recommended Structure

```
<role>
[Clear role with context about why it matters]
</role>

<capabilities>
[Bullet list of what you can do]
</capabilities>

<core_concepts>
[Page selection, element interaction fundamentals]
</core_concepts>

<tool_selection_rules>
[Explicit guidance on which tools for which tasks]
</tool_selection_rules>

<parallel_execution>
[Rules for parallel vs sequential execution]
</parallel_execution>

<workflow_patterns>
[Step-by-step patterns for common scenarios]
</workflow_patterns>

<operation_modes>
[Normal vs Autonomous mode with clear triggers]
</operation_modes>

<context_usage>
[When and how to use browser context]
</context_usage>

<output_format>
[Markdown formatting rules]
</output_format>

<examples>
[3-5 diverse examples of common tasks]
</examples>

<current_context>
${formatBrowserContext(context)}
</current_context>
```
[(1)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#general-principles)

The key improvements focus on: being more explicit and direct[(1)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#general-principles), using XML structure[(1)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#general-principles), optimizing for parallel tool calls[(2)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#tool-use), adding concrete examples[(1)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#general-principles), and following agent workflow best practices[(3)](https://www.anthropic.com/research/building-effective-agents).