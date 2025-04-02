import { join } from 'node:path';
import AutoLoad from '@fastify/autoload';

// Pass --options via CLI arguments in command to enable these options.
export const options = {};

export default async function (fastify, opts) {
  fastify.register(AutoLoad, {
    dir: join(import.meta.dirname, 'plugins/external'),
    options: { ...opts },
  });

  fastify.register(AutoLoad, {
    dir: join(import.meta.dirname, 'plugins/custom'),
    options: { ...opts },
  });

  fastify.register(AutoLoad, {
    dir: join(import.meta.dirname, 'routes'),
    autoHooksPattern: /.*hooks(\.js|\.cjs)$/,
    ignorePattern: /.*(shared|utils|schema)\-?(.+)?(\.js|\.cjs)$/,
    autoHooks: true,
    cascadeHooks: true,
    routeParams: true,
    options: {
      ...opts,
      prefix: '/api/v1/carts',
    },
  });

  fastify.register(AutoLoad, {
    dir: join(import.meta.dirname, 'services'),
    ignorePattern: /.*(shared|utils|schema)\-?(.+)?(\.js|\.cjs)$/,
  });
}
