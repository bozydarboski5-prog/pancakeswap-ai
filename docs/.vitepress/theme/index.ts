import DefaultTheme from 'vitepress/theme'
import HomeQuickstart from './components/HomeQuickstart.vue'
import HomePlayground from './components/HomePlayground.vue'
import './custom.css'

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomeQuickstart', HomeQuickstart)
    app.component('HomePlayground', HomePlayground)
  }
}
