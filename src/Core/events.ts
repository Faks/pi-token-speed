import type { AgentEndEvent, ExtensionContext } from '@earendil-works/pi-coding-agent'
import { TOKEN_GENERATION_TOOLS } from '../Config/app.js'
import { settings } from '../Config/settings.js'
import type { MessageUpdatePayload, ToolCall } from '../Contracts/config-types.js'
import type { Renderer } from '../UI/renderer.js'
import type { TokenSpeedEngine } from './engine.js'

/**
 * Manages all Pi event subscriptions for the token-speed extension.
 */
export class EventManager {
  readonly engine: TokenSpeedEngine
  readonly renderer: Renderer

  constructor(engine: TokenSpeedEngine, renderer: Renderer) {
    this.engine = engine
    this.renderer = renderer
  }

  /**
   * Initializes the engine and renderer for a new session.
   *
   * @param ctx The Pi extension context.
   */
  async handleSessionStart(ctx: ExtensionContext): Promise<void> {
    const config = await settings.initialize()
    const { errors } = settings

    if (errors.length > 0) {
      const message = ['[pi-token-speed]', ...errors].join('\n')
      ctx.ui.notify(message, 'warning')
    }

    this.engine.initialize(config)
    this.renderer.initialize(ctx)
  }

  /**
   * Stops the engine when the session shuts down.
   */
  handleSessionShutdown(): void {
    this.engine.stop()
  }

  /**
   * Starts TTFT measurement for user messages and begins streaming for assistant messages.
   *
   * @param event The message_start event payload.
   */
  handleMessageStart(event: { message?: { role?: string } }): void {
    if (event.message?.role === 'user') {
      this.engine.startTtft()
    }
  }

  /**
   * Routes delta events to the engine and updates the renderer.
   *
   * @param event The message_update event payload.
   * @param ctx The Pi extension context.
   */
  handleMessageUpdate(event: MessageUpdatePayload, ctx: ExtensionContext): void {
    const ev = event.assistantMessageEvent

    this.handleEventType(ev, ctx)
  }

  /**
   * Handles a specific event type.
   *
   * @param ev The event payload.
   * @param ctx The Pi extension context.
   */
  handleEventType(ev: MessageUpdatePayload['assistantMessageEvent'], ctx: ExtensionContext): void {
    if (this.isStartEvent(ev.type)) {
      this.engine.stopTtft()
      this.engine.start()
      return
    }

    if (this.isDeltaEvent(ev.type)) {
      this.engine.recordDelta(ev.delta ?? '', ev.partial?.usage?.output)
      this.renderer.update(ctx)
      return
    }

    if (ev.type === 'toolcall_delta') {
      this.handleToolcallDelta(ev, ctx)
    }

    if (ev.type === 'toolcall_end') {
      this.handleToolcallEnd(ev)
    }
  }

  /**
   * Checks if the event type is a start event.
   *
   * @param type The event type.
   * @returns True if it's a start event.
   */
  isStartEvent(type: string): boolean {
    return type === 'text_start' || type === 'thinking_start' || type === 'toolcall_start'
  }

  /**
   * Checks if the event type is a delta event.
   *
   * @param type The event type.
   * @returns True if it's a delta event.
   */
  isDeltaEvent(type: string): boolean {
    return type === 'text_delta' || type === 'thinking_delta'
  }

  /**
   * Handles a toolcall delta event.
   *
   * @param ev The event payload.
   * @param ctx The Pi extension context.
   */
  handleToolcallDelta(ev: MessageUpdatePayload['assistantMessageEvent'], ctx: ExtensionContext): void {
    const toolCall = ev.partial?.content?.[ev.contentIndex ?? 0]
    if (toolCall?.type !== 'toolCall') {
      return
    }

    // Only edit/write tools are counted (token generation, relevant)
    if (this.isTokenGenerationTool(toolCall)) {
      this.engine.recordDelta(ev.delta ?? '', ev.partial?.usage?.output)
      this.renderer.update(ctx)
    }
  }

  /**
   * Handles a toolcall end event.
   *
   * @param ev The event payload.
   */
  handleToolcallEnd(ev: MessageUpdatePayload['assistantMessageEvent']): void {
    const toolCall = ev.partial?.content?.[ev.contentIndex ?? 0]
    if (toolCall?.type !== 'toolCall') {
      return
    }

    // Pause the timer for prompt processing tools, so they don't skew the average
    if (this.isPromptProcessingTool(toolCall)) {
      this.engine.pause()
    }
  }

  /**
   * Reconciles the total token count, stops streaming, and updates the renderer.
   *
   * @param event The message_end event payload.
   * @param ctx The Pi extension context.
   */
  handleAgentEnd(event: AgentEndEvent, ctx: ExtensionContext): void {
    this.engine.stop()

    const outputTokens = event.messages.reduce((acc, curr) => {
      if ('usage' in curr && curr.usage?.output !== null && curr.usage?.output !== undefined) {
        return acc + curr.usage.output
      }
      return acc
    }, 0)

    this.engine.reconcileTotal(outputTokens)
    this.renderer.update(ctx)
  }

  /**
   * Determines if it's a tool that generates tokens
   *
   * @param tool The tool used by Pi
   * @returns True if it's related to token generation
   */
  isTokenGenerationTool(tool?: ToolCall): boolean {
    return TOKEN_GENERATION_TOOLS.has(tool?.name ?? '')
  }

  /**
   * Determines if it's a tool that processes tokens
   *
   * @param tool The tool used by Pi
   * @returns True if it's related to prompt processing
   */
  isPromptProcessingTool(tool?: ToolCall): boolean {
    return !this.isTokenGenerationTool(tool)
  }
}
