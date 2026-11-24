// Construye la app del móvil (carpeta «publicar») a partir de plantilla.html
// y del código común que hay en ../index.html (la web del PC).
// Uso:  node movil/construir.js
// Después, sube el contenido de movil/publicar a GitHub.

const fs = require('fs'), path = require('path');
const dir = __dirname, out = path.join(dir, 'publicar');
const pc = fs.readFileSync(path.join(dir, '..', 'index.html'), 'utf8');
const js = pc.split('<script>')[1].split('</script>')[0];

// Trozos del PC que usa el móvil (funciones y constantes, en este orden)
const PIEZAS = [
  'const esc', 'const clean', 'function parseDe', 'function lineOf', 'function toTxt', 'function fromTxt',
  'function wordHTML', 'const fmtExtra', 'const sayText', 'function umlaut', 'function applyPl', 'function nounForms',
  'const artSpan', 'function pairHTML', 'const sayAll', 'function formsHTML', 'function formsText',
  'const ART_RULES', 'function artHint', 'function shuffle',
  'const VERBS', 'const PERS', 'const PRON', 'const vStem', 'const naive', 'function conj', 'function vTag',
];
function pieza(inicio){
  const i = js.indexOf('\n' + inicio + (inicio.startsWith('function') ? '(' : ' '));
  if (i < 0) throw new Error('No encuentro en index.html: ' + inicio);
  const s = i + 1, eol = js.indexOf('\n', s), first = js.slice(s, eol);
  if (inicio.startsWith('function')){
    // función: desde la primera { hasta su } de cierre (solo se cuentan llaves)
    let d = 0, j = js.indexOf('{', s);
    for (; j < js.length; j++){ if (js[j] === '{') d++; else if (js[j] === '}' && --d === 0) break; }
    return js.slice(s, j + 1);
  }
  // constante: una línea, o varias si la línea acaba en «[» (VERBS, ART_RULES) hasta la línea «];»
  if (/\[\s*$/.test(first)) return js.slice(s, js.indexOf('\n];', s) + 3);
  return first;
}
let comun = PIEZAS.map(pieza).join('\n');

const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));
let html = fs.readFileSync(path.join(dir, 'plantilla.html'), 'utf8')
  .replace('/*@@COMUN@@*/', () => comun)
  .replace(/@@CLIENT_ID@@/g, cfg.clientId)
  .replace(/@@RUTA@@/g, cfg.carpetaOneDrive)
  .replace(/@@VERSION@@/g, String(Date.now()));
new Function(html.split('<script>')[1].split('</script>')[0]); // comprobación de sintaxis

fs.mkdirSync(out, {recursive: true});
fs.writeFileSync(path.join(out, 'index.html'), html);
for (const f of ['manifest.webmanifest', 'icono-192.png', 'icono-512.png'])
  fs.copyFileSync(path.join(dir, f), path.join(out, f));
fs.writeFileSync(path.join(out, 'sw.js'), fs.readFileSync(path.join(dir, 'sw.js'), 'utf8').replace('@@VERSION@@', String(Date.now())));
console.log('✓ App del móvil construida en', out);
