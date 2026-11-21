import { test } from 'node:test';
import assert from 'node:assert/strict';
import { norm, select } from '../api/knowledge.js';
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
