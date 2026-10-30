import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFreshSession } from '../src/lib/auth/session-read.mjs';
const config={baseUrl:'https://auth.example.test/',cookies:{secret:'test-only-cookie-secret-at-least-32-chars'}};
test('fresh render session reads tolerate deletion/refresh cookies and bypass signed-cookie cache',async()=>{
 const original=globalThis.fetch;
 try {
  const identity={user:{id:'u'},session:{id:'s',expiresAt:'2099-01-01T00:00:00Z'}};
  let calls=0;
  globalThis.fetch=async(url,options)=>{
   calls++;
   assert.equal(new URL(url).searchParams.get('disableCookieCache'),'true');
   assert.equal(new URL(url).searchParams.get('disableRefresh'),'true');
   assert.ok(!(new Headers(options.headers).get('cookie') || '').includes('unrelated-secret'));
   assert.match(new Headers(options.headers).get('cookie'), /__Secure-neon-auth.session_token=expired/);
   return new Response(JSON.stringify(calls===1?null:identity),{headers:{'content-type':'application/json','set-cookie':'__Secure-neon-auth.session_token=; Path=/; Max-Age=0'}});
  };
  const headers=new Headers({cookie:'__Secure-neon-auth.session_token=expired; unrelated-secret=no'});
  assert.equal(await readFreshSession(config,headers),null);
  assert.deepEqual(await readFreshSession(config,headers),identity);
 }finally{globalThis.fetch=original;}
});
test('invalid or failed upstream session reads deny access',async()=>{
 const original=globalThis.fetch;
 try {
  for(const data of [{user:{id:'u'}},{user:{id:'u'},session:{id:'s',expiresAt:'2000-01-01'}},null]){
   globalThis.fetch=async()=>Response.json(data);
   assert.equal(await readFreshSession(config,new Headers()),null);
  }
  globalThis.fetch=async()=>new Response('{}',{status:503});
  assert.equal(await readFreshSession(config,new Headers()),null);
 }finally{globalThis.fetch=original;}
});
