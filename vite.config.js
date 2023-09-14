import { resolve } from 'path'
import { defineConfig, loadEnv } from 'vite'
import Delete from 'rollup-plugin-delete'
import vue2 from '@vitejs/plugin-vue2'

export default ({ mode }) => {
  const { VITE_PORT, VITE_BASE_URL } = loadEnv(mode, process.cwd())

  return defineConfig({
    base: VITE_BASE_URL,
    plugins: [vue2()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    css: {
      preprocessorOptions: {
        less: {
          modifyVars: {
            hack: `true; @import (reference) "${resolve('src/style/variables.less')}";`
          },
          math: 'strict',
          javascriptEnabled: true
        }
      }
    },
    server: {
      // 是否开启 https
      https: false,
      // 端口号
      port: VITE_PORT,
      // 监听所有地址
      host: '0.0.0.0',
      // 服务启动时是否自动打开浏览器
      open: true,
      // 允许跨域
      cors: true,
      // 自定义代理规则
      proxy: {}
    },
    build: {
      lib: {
        // Could also be a dictionary or array of multiple entry points
        entry: resolve(__dirname, '/src/components/index.js'),
        name: 'splitpanes',
        // the proper extensions will be added
        fileName: 'splitpanes',
        formats: ['es', 'umd', 'cjs']
      },
      rollupOptions: {
        plugins: [Delete({ targets: ['dist/*.{ico,png,html}'], hook: 'generateBundle' })],
        // 确保外部化处理那些你不想打包进库的依赖
        external: ['vue'],
        output: {
          // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
          globals: {
            vue: 'Vue'
          }
        }
      }
    }
  })
}
