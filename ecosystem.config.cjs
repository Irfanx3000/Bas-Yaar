/* pm2 process definition for the Next.js site.
 *
 * Named `crewapply-web` so it sits alongside the existing `crewapply-api`
 * without either reload touching the other.
 *
 * `.cjs`, not `.js` — pm2 loads this file with require(), and a bare .js in a
 * package that Next treats as ESM would fail to parse.
 *
 * The script is Next's own binary rather than `npm start`. npm forks a shell
 * that forks node, so pm2 ends up supervising the shell: it reports the wrong
 * pid, `pm2 reload` can leave the real server orphaned, and signals do not reach
 * it. Pointing at the binary keeps pm2 supervising the actual process.
 *
 * NOT in cluster mode. Next's standalone server is already a single node
 * process per port, and running several instances on one port needs
 * reusePort/a socket the app does not open. One instance behind nginx is the
 * supported shape; scale by adding ports and upstreams if it ever matters.
 */
module.exports = {
  apps: [
    {
      name: "crewapply-web",
      cwd: "/var/www/crewapply-web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,

      /* Next reads NEXT_PUBLIC_* at build time, so this does nothing for the
         API URL — it is already baked into the bundle. NODE_ENV is what matters
         at runtime: it turns off the dev-only SSRF exemption in next.config.mjs
         and puts Next in production mode. */
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },

      /* A Next build can outgrow the default heap on a small VPS; this ceiling
         restarts a leaking process rather than letting the OOM killer take the
         whole box, backend included. */
      max_memory_restart: "512M",

      error_file: "/var/log/pm2/crewapply-web.error.log",
      out_file: "/var/log/pm2/crewapply-web.out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
