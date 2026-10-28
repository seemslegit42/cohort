#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createLeadwaveMcpServer } from '../src/mcp-server';

async function main() {
  process.stderr.write('[Leadwave CRM MCP] Starting Model Context Protocol server over Stdio transport...\n');
  
  try {
    const server = createLeadwaveMcpServer();
    const transport = new StdioServerTransport();
    
    await server.connect(transport);
    process.stderr.write('[Leadwave CRM MCP] Server connected to Stdio transport. Listening for JSON-RPC 2.0 messages.\n');
  } catch (err) {
    process.stderr.write(`[Leadwave CRM MCP] Fatal startup error: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  process.stderr.write(`[Leadwave CRM MCP] Uncaught rejection: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
