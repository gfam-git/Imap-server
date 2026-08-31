import { McpServer } from '@modelcontextprotocol/server';

const s = new McpServer({name: 'test', version: '0.1'});
console.log('registerTool type:', typeof s.registerTool);

// Check what registerTool expects
const sig = s.registerTool.toString();
console.log('registerTool signature:', sig);
