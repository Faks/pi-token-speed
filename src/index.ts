import type {
  AgentEndEvent,
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
  SessionStartEvent
} from '@earendil-works/pi-coding-agent'

import { CommandManager } from './Console/Commands/commands.js'
import { TokenSpeedEngine } from './Core/engine.js'
import { EventManager } from './Core/events.js'
import { Renderer } from './UI/renderer.js'

export async function register(pi: ExtensionAPI): Promise<void> {
  const engine = new TokenSpeedEngine()
  const renderer = new Renderer(engine)
  const commands = new CommandManager(renderer, engine)
  const eventManager = new EventManager(engine, renderer)

  // Command registration
  pi.registerCommand('tps', {
    description: 'Open settings menu to configure display mode, token counting strategy, and provider token usage',
    handler: (_args: string, ctx: ExtensionCommandContext) => commands.runTps(ctx)
  })

  // Session lifecycle
  pi.on('session_start', async (_event: SessionStartEvent, ctx: ExtensionContext) => {
    await eventManager.handleSessionStart(ctx)
  })

  pi.on('session_shutdown', () => {
    eventManager.handleSessionShutdown()
  })

  // Streaming lifecycle
  pi.on('message_start', (event) => {
    eventManager.handleMessageStart(event)
  })

  pi.on('message_update', (event, ctx: ExtensionContext) => {
    eventManager.handleMessageUpdate(event, ctx)
  })

  pi.on('agent_end', (event: AgentEndEvent, ctx: ExtensionContext) => {
    eventManager.handleAgentEnd(event, ctx)
  })
}
