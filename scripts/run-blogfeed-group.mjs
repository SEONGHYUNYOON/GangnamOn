import { Client, Functions, ExecutionMethod } from 'node-appwrite';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const endpoint = 'https://fra.cloud.appwrite.io/v1';
const projectId = '6a4be56a00369cf49a31';
const forceGroup = process.argv[2];
const count = Number(process.argv[3] || 5);

if (!forceGroup) {
  console.error('Usage: node scripts/run-blogfeed-group.mjs <group> [count]');
  process.exit(1);
}

const prefs = JSON.parse(readFileSync(join(homedir(), '.appwrite', 'prefs.json'), 'utf8'));
const apiKey = prefs[prefs.current]?.key;

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const functions = new Functions(client);

const body = JSON.stringify({ forceGroup, count });
const execution = await functions.createExecution('blogFeed', body, true, '/', ExecutionMethod.POST);
console.log('executionId:', execution.$id, 'group:', forceGroup, 'count:', count);

for (let i = 0; i < 60; i++) {
  await new Promise((r) => setTimeout(r, 5000));
  const current = await functions.getExecution('blogFeed', execution.$id);
  console.log(`poll ${i + 1}: ${current.status}`);
  if (current.status === 'completed' || current.status === 'failed') {
    console.log('response:', current.responseBody);
    if (current.logs) console.log('logs tail:', current.logs.slice(-800));
    break;
  }
}
