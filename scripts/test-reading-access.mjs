import assert from 'node:assert/strict';
import { beforeEach, after, test } from 'node:test';
import { pool } from './helpers/test-db.mjs';
import { canReadCatalogBook, canReadBabel } from '../src/lib/queries/reading.js';

beforeEach(async()=>{
 await pool.query('truncate waitlist, wishlist, admin_events, reservations, books, neon_auth."user" restart identity cascade');
 await pool.query(`insert into neon_auth."user" (id,name,email) values ('reader','Reader','r@example.test'), ('other','Other','o@example.test')`);
 await pool.query(`insert into books (title,author) values ('One','A'), ('Two','B')`);
});
after(()=>pool.end());
test('reading requires the exact member and a confirmed pickup of the exact book',async()=>{
 assert.equal(await canReadCatalogBook('reader',1),false);
 await pool.query(`insert into reservations (user_id,book_id) values ('reader',1)`);
 assert.equal(await canReadCatalogBook('reader',1),false);
 assert.equal(await canReadBabel('reader'),false);
 await pool.query(`update reservations set status='picked_up',picked_up_at=now()`);
 assert.equal(await canReadCatalogBook('reader',1),true);
 assert.equal(await canReadCatalogBook('other',1),false);
 assert.equal(await canReadCatalogBook('reader',2),false);
 assert.equal(await canReadBabel('reader'),true);
 assert.equal(await canReadBabel('other'),false);
});
test('returned, cancelled, expired and inconsistent pickups cannot unlock reading',async()=>{
 await pool.query(`insert into reservations (user_id,book_id,status) values ('reader',1,'picked_up')`);
 assert.equal(await canReadBabel('reader'),false);
 await pool.query(`update reservations set picked_up_at=now(), returned_at=now()`);
 assert.equal(await canReadCatalogBook('reader',1),false);
 for(const status of ['returned','cancelled','expired','reserved']){
  await pool.query('update reservations set status=$1, returned_at=null',[status]);
  assert.equal(await canReadCatalogBook('reader',1),false);
  assert.equal(await canReadBabel('reader'),false);
 }
});
test('overdue loans remain readable; returns and deleted books revoke access immediately',async()=>{
 await pool.query(`insert into reservations (user_id,book_id,status,picked_up_at) values ('reader',1,'picked_up',now()-interval '100 days')`);
 assert.equal(await canReadCatalogBook('reader',1),true);
 await pool.query(`update reservations set status='returned',returned_at=now()`);
 assert.equal(await canReadCatalogBook('reader',1),false);
 await pool.query(`update reservations set status='picked_up',returned_at=null`);
 await pool.query(`update books set deleted_at=now() where id=1`);
 assert.equal(await canReadCatalogBook('reader',1),false);
 assert.equal(await canReadBabel('reader'),false);
});
