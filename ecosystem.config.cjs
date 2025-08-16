module.exports = {
  apps: [
    {
      name: 'render-tgm-backend',
      cwd: '/var/www/RENDER-TGM/backend',
      script: 'src/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'render-tgm-frontend',
      cwd: '/var/www/RENDER-TGM',
      script: 'npm',
      args: 'run preview',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
}; 