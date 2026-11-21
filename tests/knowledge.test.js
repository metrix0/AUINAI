import { test } from 'node:test';
import assert from 'node:assert/strict';
import { norm, select, normalizeCompanyName } from '../api/knowledge.js';
const dataset={
 pages:[{title:'Perguntas frequentes',url:'https://auin.unesp.br/perguntas-frequentes/',text:'A AUIN orienta sobre patentes e propriedade intelectual.'}],
 companies:[
  {name:'Primeira Startup',city:'RIO CLARO',category:'1',description:'Tecnologia',email:'',phone:''},
  {name:'Segunda Startup',city:'RIO CLARO',category:'1',description:'Software',email:'',phone:''},
  {name:'Junior RC',city:'RIO CLARO',category:'3',description:'Consultoria',email:'',phone:''},
  {name:'Ambiente RC',city:'RIO CLARO',category:'2',description:'Inovação',email:'',phone:''},
  {name:'Startup Araraquara',city:'ARARAQUARA',category:'1',description:'Agro',email:'',phone:''}
 ],siloAvailable:true
};
test('normaliza acentos',()=>assert.equal(norm('São João, Inovação'),'sao joao, inovacao'));
test('filtra empresas-filhas por município',()=>{
 const result=select('Quais empresas-filhas estão em Rio Claro?',dataset);
 assert.match(result.context,/Contagem EXATA de registros no filtro: 2/);
 assert.match(result.context,/Primeira Startup/);
 assert.doesNotMatch(result.context,/Nomes nesse município e categoria:[^\n]*Junior RC/);
});
test('empresas juniores são contadas em categoria separada',()=>{
 const result=select('Quantas empresas juniores existem em Rio Claro?',dataset);
 assert.match(result.context,/categoria 3/);
 assert.match(result.context,/Contagem EXATA de registros no filtro: 1/);
});
test('busca nomes específicos',()=>assert.match(select('O que faz a Primeira Startup?',dataset).context,/Primeira Startup/));
test('não inclui dados do silo numa pergunta apenas sobre patente',()=>{
 assert.doesNotMatch(select('Como proteger uma patente?',dataset).context,/BASE PÚBLICA JSON SILO/);
});

test('apresenta nomes do Silo com capitalização e siglas corretas',()=>{
 assert.equal(normalizeCompanyName('99 GEO'),'99 Geo');
 assert.equal(normalizeCompanyName('CM CONSULAB'),'CM Consulab');
 assert.equal(normalizeCompanyName('CAFÉ COM LEITE'),'Café com Leite');
 assert.equal(normalizeCompanyName('FMD GEOLOGIA APLICADA'),'FMD Geologia Aplicada');
 assert.equal(normalizeCompanyName('POWER OF DATA'),'Power of Data');
 assert.equal(normalizeCompanyName('THOTech'),'THOTech');
 assert.equal(normalizeCompanyName('Ciclo Vida'),'Ciclo Vida');
});
test('remove códigos de imagens dos nomes do Silo sem criar entidades fictícias',()=>{
 assert.equal(normalizeCompanyName('SECTRA-SISTEMAS-LOGO-M12_U34_20122019163532'),'Sectra Sistemas');
 assert.equal(normalizeCompanyName('PROVAZZI-M12_U17_23112018-15-13-48'),'Provazzi');
 assert.equal(normalizeCompanyName('R-M12_U41_23102020171050'),'');
 assert.equal(normalizeCompanyName('LOGO - VALESKA PETEK - COMUNICAÇÃO E CARREIRA'),'Logo - Valeska Petek - Comunicação e Carreira');
});
