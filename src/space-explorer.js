import './app.css'
import { mount } from 'svelte'
import SpaceExplorer from './lib/rewards/SpaceExplorer.svelte'

const app = mount(SpaceExplorer, {
  target: document.getElementById('app'),
})

export default app