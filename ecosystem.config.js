/**
 * SUSE - PM2 Ecosystem Configuration
 * Fase 5: Gerenciamento de processos com PM2 (alternativa ao Docker)
 *
 * Uso:
 *   pm2 start ecosystem.config.js          # Iniciar todos
 *   pm2 status                              # Ver status
 *   pm2 logs                                # Ver logs de todos
 *   pm2 logs suse-ia                        # Ver logs da IA
 *   pm2 restart all                         # Reiniciar todos
 *   pm2 stop all                            # Parar todos
 *   pm2 delete all                          # Remover todos
 *   pm2 startup                             # Auto-iniciar com sistema
 *   pm2 save                                # Salvar lista de processos
 */

module.exports = {
  apps: [
    {
      name: 'suse-ia',
      cwd: './suse-ia',
      script: 'ia_engine.py',
      interpreter: 'python',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        PYTHONUNBUFFERED: '1',
        FLASK_ENV: 'production',
      },
      error_file: './logs/suse-ia-error.log',
      out_file: './logs/suse-ia-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
    {
      name: 'suse-backend',
      cwd: './backend',
      script: 'dist/app.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: '4000',
        IA_HOST: 'localhost',
        IA_PORT: '5000',
      },
      error_file: './logs/suse-backend-error.log',
      out_file: './logs/suse-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
    {
      name: 'suse-frontend',
      cwd: '.',
      script: 'node_modules/.bin/vite',
      args: 'preview --host --port 3001',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/suse-frontend-error.log',
      out_file: './logs/suse-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
