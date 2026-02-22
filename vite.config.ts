import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/app/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'static/dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/add_event': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/toggle_event_active': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/event': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/update_event': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/add_checklist_item': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/remove_checklist_item': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/update_event_checklist': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/add_event_supplier': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/remove_event_supplier': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/update_event_equipment': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/add_event_charge': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/edit_event_charge': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/update_event_graphics': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/export_event_graphics': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/update_event_management_table': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/export_event_management': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/update_event_shopping_list': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/export_event_shopping': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/export_event_equipment': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/add_equipment_to_bank': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/events_archive': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/upload_logo': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/toggle_client_active': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/static': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Proxy all Flask routes
      '^/(login|logout|client|all_clients|finance|events|suppliers|quotes|forms|admin|quick_update|quick_add_task|quick_add_charge|get_client_projects|update_task|add_project|add_task|add_event|upload_logo|upload_document|add_activity|delete_activity|add_contact|delete_contact|add_client|delete_document|download_doc|reset_password|archive|toggle_client_active|delete_charge|update_charge_our_cost|update_finance)': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})

