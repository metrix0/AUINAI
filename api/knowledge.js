// Busca exclusivamente fontes públicas da AUIN e o mapa de empresas no JSON Silo.
const SITE='https://auin.unesp.br';
export const SILO='https://api.jsonsilo.com/public/8e9e5c10-b6d9-4e91-a03c-d93fd8a7ffb7';
const PAGES=[
['Perguntas frequentes','/perguntas-frequentes/'],['Conheça a AUIN','/conheca-a-auin/'],
['Empresas-filhas e startups','/empresas-filhas-e-startups/'],['Empreendedores','/empreendedores/'],
['Empresas','/empresas/'],['Inventores','/inventores/'],
['Propriedade intelectual','/propriedade-intelectual/'],['Comunicar invenção','/comunicarinvencao/'],
['Plataforma de ideação','/plataforma-de-ideacao/'],['Página inicial e notícias','/'],
['Ambientes de inovação','/ambientes-de-inovacao/'],['Contato','/contato/']
];
const STOP=new Set('como para sobre onde quais qual quem quero preciso posso pode minha meu fazer informações informar empresa empresas unesp auin por com dos das uma uns que isso essa seus entre hoje'.split(' '));
export const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
// O Silo público usa muitas letras maiúsculas e alguns nomes importados de arquivos.
// Normalizar apenas a apresentação, sem alterar os registros de origem.
const NAME_PARTICLES=new Set(['de','da','do','das','dos','e','em','com','para','por','of','and','the','for','in']);
const NAME_ACRONYMS=new Set(['AI','IA','TI','CM','FMD','ERP','USP','UNESP','SENAI','SENAC','MEI','IBGE','GPS','API','DNA','RNA','CNPJ','LTDA','ME','EIRELI','SP','RJ','MG','RS','PR','ES','DF','B2B','B2C']);
export function normalizeCompanyName(value){
 let name=String(value??'').normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g,'').trim().replace(/\s+/g,' ');
 // Exemplos encontrados no Silo: SECTRA-SISTEMAS-LOGO-M12_U34_..., PROVAZZI-M12_U17_...
 const cleaned=name.replace(/(?:[-_ ]+(?:LOGO|LOGOTIPO|IMG|IMAGEM|IMAGE))?[-_ ]+M\d+_U\d+_\d{6,}(?:[-_]\d+)*$/i,'').trim();
 if(cleaned!==name){
  name=cleaned.replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim();
  if(name.length<2)return ''; // Nome composto só de inicial de arquivo, sem empresa identificável.
 }
 return name.replace(/[\p{L}]+(?:['’][\p{L}]+)*/gu,(word,index)=>{
  const upper=word.toLocaleUpperCase('pt-BR'),lower=word.toLocaleLowerCase('pt-BR');
  if(word!==upper&&word!==lower)return word; // Preserva marcas já grafadas como THOTech.
  if(NAME_ACRONYMS.has(upper))return upper;
  if(index>0&&NAME_PARTICLES.has(lower))return lower;
  return lower[0].toLocaleUpperCase('pt-BR')+lower.slice(1);
 });
}

const terms=s=>[...new Set((norm(s).match(/[a-z0-9]{3,}/g)||[]).filter(x=>!STOP.has(x)))].slice(0,22);
function decode(s){return String(s).replace(/&#(x[0-9a-f]+|[0-9]+);/gi,(m,n)=>{const v=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):parseInt(n,10);return v>0&&v<=0x10ffff?String.fromCodePoint(v):' ';}).replace(/&(?:nbsp|amp|quot|lt|gt|rsquo|ldquo|rdquo|ndash|mdash|hellip);/gi,m=>({'&nbsp;':' ','&amp;':'&','&quot;':'"','&lt;':'<','&gt;':'>','&rsquo;':'’','&ldquo;':'“','&rdquo;':'”','&ndash;':'–','&mdash;':'—','&hellip;':'…'})[m.toLowerCase()]||' ');}
function extract(html){
 const body=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1]||html;
 return decode(body.replace(/<(script|style|nav|footer|header|svg|noscript|form)\b[^>]*>[\s\S]*?<\/\1>/gi,' ')
  .replace(/<!--[\s\S]*?-->/g,' ').replace(/<\/(p|div|h[1-6]|li|section|article|br)>/gi,'\n')
  .replace(/<[^>]*>/g,' ').replace(/[ \t]+/g,' ').replace(/\n[ \t]*/g,'\n').replace(/\n{3,}/g,'\n\n')).trim().slice(0,34000);
}
async function page(title,path){
 try{const r=await fetch(SITE+path,{signal:AbortSignal.timeout(6500),next:{revalidate:3600}});
 if(!r.ok)return null;const text=extract(await r.text());return text.length>100?{title,url:SITE+path,text}:null;
 }catch{return null;}
}
let cache=null,updated=0,inflight=null;
export async function load(){
 if(cache&&Date.now()-updated<900000)return cache;
 if(!inflight)inflight=Promise.all([
  Promise.all(PAGES.map(([a,b])=>page(a,b))),
  fetch(SILO,{signal:AbortSignal.timeout(6500),next:{revalidate:900}}).then(r=>r.ok?r.json():[]).catch(()=>[])
 ]).then(([pages,raw])=>{
  const cities=Array.isArray(raw)?raw:Array.isArray(raw?.value)?raw.value:[];
  const companies=cities.flatMap(city=>(Array.isArray(city?.businesses)?city.businesses:[])
   .filter(x=>x?.name).map(x=>({
    name:normalizeCompanyName(String(x.name).slice(0,140)),city:String(city.name||city.info||'').slice(0,70),
    description:String(x.description||'').slice(0,850),category:String(x.category||''),
    email:String(x.email||'').slice(0,120),phone:String(x.phone||'').slice(0,30)
   })).filter(x=>x.name));
  const result={pages:pages.filter(Boolean),companies,siloAvailable:cities.length>0};
  if(result.pages.length||result.siloAvailable){cache=result;updated=Date.now();}
  return cache||result;
 }).finally(()=>{inflight=null;});
 return inflight;
}
function score(s,words){const hay=norm(s);return words.filter(w=>hay.includes(w)).length;}
function excerpt(text,words){return text.split(/\n+/).map((s,i)=>({s:s.trim(),i,w:score(s,words)})).filter(x=>x.s.length>25).sort((a,b)=>b.w-a.w||a.i-b.i).slice(0,5).map(x=>x.s.slice(0,380)).join(' | ').slice(0,1400);}
export function select(question,dataset,previous=''){
 const words=terms(question+' '+previous.slice(-280));
 const ranked=dataset.pages.map(p=>({p,w:score(p.title,words)*6+score(p.text,words)})).sort((a,b)=>b.w-a.w).filter(x=>x.w>0).slice(0,5);
 const sources=ranked.slice(0,4).map(x=>({title:x.p.title,url:x.p.url}));
 const context=ranked.map(x=>'SITE OFICIAL: '+x.p.title+'\nURL: '+x.p.url+'\n'+excerpt(x.p.text,words)).join('\n\n---\n\n');
 const phrase=norm(question);
 const prior=norm(previous);
 const companyName=dataset.companies.find(c=>c.name.length>5&&phrase.includes(norm(c.name)));
 const about=/empres|startup|spin.off|junior|empreend|cidade|municipio|filha|rio claro|araraquara|botucatu|ambiente de inovacao|parque tecnologico/i.test(norm(question+' '+previous))||Boolean(companyName);
 if(!about||!dataset.siloAvailable)return {context:context.slice(0,11000),sources};
 const kind=phrase+' '+prior;
 // Categorias confirmadas no código do mapa PÚBLICO de auin.unesp.br (2026).
 const type={'1':'empresas-filhas e startups','2':'ambientes de inovação','3':'empresas juniores','4':'parques tecnológicos'};
 let category=null;
 if(/junior/.test(kind))category='3';
 else if(/ambiente|incubadora/.test(kind))category='2';
 else if(/parque tecnologico/.test(kind))category='4';
 else if(/filha|startup|spin.off|empresa/.test(kind))category='1';
 const cityNames=[...new Set(dataset.companies.map(c=>c.city))].filter(x=>x.length>3).sort((a,b)=>b.length-a.length);
 const city=cityNames.find(name=>phrase.includes(norm(name)))||null;
 // Uma pergunta com nome exato de organização vence filtros genéricos.
 const selected=companyName?[companyName]:
  dataset.companies.filter(c=>(!category||c.category===category)&&(!city||c.city===city));
 const scores=selected.map(c=>({c,w:score(c.name+' '+c.city+' '+c.description,words)*3+(phrase.includes(norm(c.name))&&c.name.length>3?25:0)}))
  .sort((a,b)=>b.w-a.w);
 const matches=(city||companyName?scores:scores.filter(x=>x.w>0)).slice(0,18).map(x=>x.c);
 const categories=Object.fromEntries(Object.keys(type).map(id=>[type[id],dataset.companies.filter(c=>c.category===id).length]));
 const scope=(category?'categoria '+category+' ('+type[category]+')':'todas as categorias')+(city?' em '+city:'');
 const companyContext='BASE PÚBLICA JSON SILO (mesmo conjunto usado no mapa AUIN). Categorias confirmadas pela página oficial: 1=empresas-filhas e startups; 2=ambientes de inovação; 3=empresas juniores; 4=parques tecnológicos.'+
  '\nContagens totais por categoria: '+JSON.stringify(categories)+
  '\nFiltro aplicado: '+scope+'. Contagem EXATA de registros no filtro: '+selected.length+'.'+
  (city?'\nNomes nesse município e categoria: '+selected.map(c=>c.name).join('; ').slice(0,4300)+'.':'')+
  '\nRegistros detalhados mais pertinentes:\n'+(matches.length?matches.map(x=>JSON.stringify({...x,categoryLabel:type[x.category]||'Não especificada'})).join('\n'):'Não foi encontrado registro correspondente.');
 sources.unshift({title:'Mapa de empresas-filhas e startups',url:SITE+'/empresas-filhas-e-startups/'});
 return {context:(companyContext+'\n\n'+context).slice(0,14500),sources:[...new Map(sources.map(x=>[x.url,x])).values()].slice(0,4)};
}
