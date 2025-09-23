import './app.css'
import { mount } from 'svelte'
import SessionLogs from './lib/SessionLogs.svelte'

const app = mount(SessionLogs, {
  target: document.getElementById('app'),
})

export default app