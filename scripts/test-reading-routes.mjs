import assert from 'node:assert/strict';
import { beforeEach, after, test } from 'node:test';
import { pool } from './helpers/test-db.mjs';
import { setUser } from './helpers/reading-session.mjs';
import { catalogEdition, inventedEdition } from '../src/lib/babel-book/sources.js';
import { GET as catalogDownload } from '../src/app/(library)/books/[id]/read/[edition]/download/route.js';
import { GET as babelDownload } from '../src/app/(library)/babel/[seed]/download/route.js';
beforeEach(async()=>{
 setUser(null);
 await pool.query('truncate waitlist, wishlist, admin_events, reservations, books, neon_auth."user" restart identity cascade');
 await pool.query(`insert into neon_auth."user" (id,name,email) values ('reader','Reader','r@example.test')`);
 await pool.query(`insert into books(title,author) values ('Test book','Author')`);
});
after(()=>pool.end());
test('shared contents/chapter loaders never generate prose for anonymous or unentitled members', async()=>{
 for(const load of [()=>catalogEdition('1','1'),()=>inventedEdition('42')]){
  setUser(null);assert.deepEqual(await load(),{locked:true,signedIn:false});
  setUser({id:'reader',isAdmin:true});const denied=await load();assert.equal(denied.locked,true);assert.equal(denied.edition,undefined);
 }
 assert.equal(await catalogEdition('abc','1'),null);
 assert.equal(await inventedEdition('-1'),null);
});
test('loaders unlock with pickup and relock after return, including repeat reads of same URL',async()=>{
 setUser({id:'reader'});
 await pool.query(`insert into reservations(user_id,book_id,status,picked_up_at) values('reader',1,'picked_up',now())`);
 assert.equal((await catalogEdition('1','1')).edition.chapters.length,10);
 assert.equal((await inventedEdition('42')).edition.chapters.length,10);
 await pool.query(`update reservations set status='returned',returned_at=now()`);
 assert.equal((await catalogEdition('1','1')).locked,true);
 assert.equal((await inventedEdition('42')).locked,true);
});
test('retired export URLs cannot bypass borrowing and are never publicly cached',async()=>{
 for(const handler of [catalogDownload,babelDownload]){
  const response=await handler();assert.equal(response.status,410);
  assert.equal(response.headers.get('cache-control'),'private, no-store');
  assert.ok(!(await response.text()).includes('<html'));
 }
});
