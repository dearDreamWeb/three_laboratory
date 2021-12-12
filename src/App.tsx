import { useEffect, useRef } from 'react';
import styles from './app.module.less';
import Stars from './pages/Stars';
import Rect from './pages/rect/Rect';
import Stats from 'stats.js';

function App() {
  const stats = useRef(new Stats()).current;
  useEffect(() => {
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);
    requestAnimationFrame(animateFps);
  }, [])

  const animateFps = () => {
    stats.begin();
    stats.end();
    requestAnimationFrame(animateFps);
  }

  return (
    <div className={styles.app}>
      <Rect />
    </div>
  )
}

export default App
