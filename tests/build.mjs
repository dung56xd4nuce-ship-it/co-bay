import fs from 'fs';
const files=fs.readdirSync('src').filter(f=>f.endsWith('.js')).sort();
const js=files.map(f=>`// ---- ${f}\n`+fs.readFileSync('src/'+f,'utf8')).join('\n');
const ver=fs.existsSync('VERSION')? fs.readFileSync('VERSION','utf8').trim() : 'dev';
const html=fs.readFileSync('src/shell.html','utf8').replace('/*__GAME__*/',()=>js).replace(/__VER__/g,ver);
fs.mkdirSync('dist',{recursive:true}); fs.writeFileSync('dist/index.html',html); console.log('built',html.length,'bytes');
