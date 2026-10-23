module.exports = {
  apps: [
    {
      name: 'manoj-mobiles',
      script: '.next/standalone/server.js',
      instances: 'max', // Multi-core cluster mode. Set to 1 if on 1GB/2GB RAM VPS
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '127.0.0.1',
      },
      max_memory_restart: '600M',
      time: true,
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
    },
  ],
}
