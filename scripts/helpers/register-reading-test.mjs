import './register-test-db.mjs';
import { registerHooks } from 'node:module';
registerHooks({resolve(specifier, context, nextResolve) {
 if (specifier === '@/lib/dal') return {url:new URL('./reading-session.mjs',import.meta.url).href,shortCircuit:true};
 return nextResolve(specifier,context);
}});
