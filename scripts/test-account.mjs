import assert from 'node:assert/strict';
import { test } from 'node:test';
import { accountSessions, updateProfile, changePassword, revokeAccountSession, revokeOtherAccountSessions } from '../src/lib/account/service.mjs';
const session={user:{id:'member'},session:{id:'current'}};
const rows=[{id:'current',userId:'member',token:'secret-current',expiresAt:'2099-01-01',userAgent:'Mozilla Firefox/120 Linux'}, {id:'other',userId:'member',token:'secret-other',expiresAt:'2099-01-01'}, {id:'foreign',userId:'outsider',token:'foreign-secret',expiresAt:'2099-01-01'}];
test('session view returns only owned active sessions and never credentials',async()=>{
 const result=await accountSessions({listSessions:async()=>({data:[...rows,{id:'old',userId:'member',expiresAt:'2000-01-01'}]})},session);
 assert.deepEqual(result.sessions.map(s=>s.id),['current','other']);
 assert.equal(result.sessions[0].current,true);
 assert.ok(!JSON.stringify(result).includes('secret'));
 assert.ok(!JSON.stringify(result).includes('userAgent'));
});
test('forged, foreign and current session IDs cannot be revoked via selected-session action',async()=>{
 const auth={listSessions:async()=>({data:rows}),revokeSession:async()=>{throw Error('must not revoke');}};
 for(const id of ['missing','foreign','current','',null]) assert.ok((await revokeAccountSession(auth,session,id)).error);
});
test('revocation resolves a session token on the server and removes only the selected owned session',async()=>{
 let active=rows.slice();
 const auth={listSessions:async()=>({data:active}),revokeSession:async({token})=>{active=active.filter(s=>s.token!==token);return {data:{status:true}};}};
 assert.ok((await revokeAccountSession(auth,session,'other')).message);
 assert.deepEqual(active.map(s=>s.id),['current','foreign']);
});
test('sign out others retains current session and reports failures',async()=>{
 let active=rows.slice();
 const auth={listSessions:async()=>({data:active}),revokeSession:async({token})=>{active=active.filter(s=>s.token!==token);return {data:{status:true}};}};
 assert.ok((await revokeOtherAccountSessions(auth,session)).message);
 assert.deepEqual(active.map(s=>s.id),['current','foreign']);
 auth.listSessions=async()=>({error:{message:'private detail'}});
 assert.ok((await revokeOtherAccountSessions(auth,session)).error);
});
test('profile validation strips everything except a bounded display name',async()=>{
 let saved;
 const auth={updateUser:async(data)=>{saved=data;return {data:{status:true}};}};
 assert.ok((await updateProfile(auth,{name:'  Ada  ',role:'admin',email:'other@example.test'})).message);
 assert.deepEqual(saved,{name:'Ada'});
 for(const name of ['', 'a'.repeat(101), '\u0000evil']) assert.ok((await updateProfile(auth,{name})).error);
});
test('password change requires current password, matching long new password and revokes other sessions',async()=>{
 let body;
 const auth={changePassword:async(data)=>{body=data;return {data:{user:{id:'member'}}};}};
 const good={currentPassword:'existing-secret',newPassword:'a new long passphrase',confirmPassword:'a new long passphrase'};
 for(const patch of [{currentPassword:''},{newPassword:'short',confirmPassword:'short'},{confirmPassword:'different'},{newPassword:'existing-secret',confirmPassword:'existing-secret'}]) assert.ok((await changePassword(auth,{...good,...patch})).error);
 assert.ok((await changePassword(auth,good)).message);
 assert.deepEqual(body,{currentPassword:good.currentPassword,newPassword:good.newPassword,revokeOtherSessions:true});
});
test('provider failures are generic and do not expose secrets or report success',async()=>{
 const auth={changePassword:async()=>({error:{message:'secret-debug-detail'}}),updateUser:async()=>{throw Error('secret-debug-detail');},listSessions:async()=>({error:{message:'secret-debug-detail'}})};
 const results=await Promise.all([changePassword(auth,{currentPassword:'old',newPassword:'long password test',confirmPassword:'long password test'}),updateProfile(auth,{name:'A'}),accountSessions(auth,session)]);
 for(const result of results){ assert.ok(result.error); assert.ok(!JSON.stringify(result).includes('secret-debug-detail')); assert.equal(result.message,undefined); }
});
test('stale sessions explain reauthentication instead of suggesting an ineffective retry',async()=>{
 const auth={listSessions:async()=>({error:{code:'SESSION_NOT_FRESH'}})};
 assert.match((await accountSessions(auth,session)).error,/sign out.*sign in/i);
});
