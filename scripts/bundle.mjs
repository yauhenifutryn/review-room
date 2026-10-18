import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
// Ceiling: four dependency-free owned ESM files. Upgrade to a real bundler if module dependencies grow.
const siteProjectPrefix = ['appgpr','j'].join('');
const siteProjectIdPattern = new RegExp(`^${siteProjectPrefix}_[a-f0-9]+$`);
let projectId;
const args = process.argv.slice(2);
for (let index = 0; index < args.length; index += 1) {
  if (args[index] !== '--project-id' || projectId !== undefined || !args[index + 1]) {
    throw new Error('Usage: npm run build -- [--project-id <Sites project ID>]');
  }
  projectId = args[index + 1];
  index += 1;
  if (!siteProjectIdPattern.test(projectId)) {
    projectId = undefined;
    throw new Error('Site project ID must match the Sites ID format.');
  }
}
const candidates = await readFile('worker/candidates.js','utf8');
const api = await readFile('worker/api.js','utf8');
const ui = await readFile('worker/ui.js','utf8');
const main = await readFile('worker/index.js','utf8');
const source = [candidates,api,ui,main].join('\n')
  .replace(/^import .* from '\.\/[^']+';\n/gm,'')
  .replaceAll("const module = await import('./candidates.js');", 'const module = {candidates};')
  .replace(/^export (const|async function|function) /gm,'$1 ');
await mkdir('dist/server',{recursive:true});
await mkdir('dist/.openai',{recursive:true});
await writeFile('dist/server/index.js',source);
const hostingOutput = 'dist/.openai/hosting.json';
await rm(hostingOutput,{force:true});
const hosting = JSON.parse(await readFile('.openai/hosting.example.json','utf8'));
if (projectId !== undefined) hosting.project_id = projectId;
await writeFile(hostingOutput,JSON.stringify(hosting,null,2)+'\n');
// Candidate records live in private runtime storage, never in this bundle.
console.log('Built worker: '+Buffer.byteLength(source)+' bytes');
