import { useEffect, useRef, useState, useMemo } from 'react';
import styles from './app.module.less';
import Stars from './pages/starts/Stars';
import Rect from './pages/rect/Rect';
import Loader from './pages/loader/Loader';
import SolarSystem from './pages/solarSystem/SolarSystem';
import Stats from 'stats.js';

const list = [
  {
    key: '0',
    text: '太阳系',
    component: <SolarSystem />
  },
  {
    key: '3',
    text: '爱跳舞的怪兽',
    component: <Loader />
  },
  {
    key: '1',
    text: '方块材质投影',
    component: <Rect />
  },
  {
    key: '2',
    text: '生成快乐星球',
    component: <Stars />
  },
]

function App() {
  const stats = useRef(new Stats()).current;
  const [checkIndex, setCheckIndex] = useState<number>(0)

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

  const ShowContext = useMemo(() => {
    return list[checkIndex].component;
  }, [checkIndex])

  return (
    <div className={styles.app}>
      {ShowContext}
      <div className={styles.optionBox}>
        {
          list.map((item, index) => {
            return (
              <div
                key={item.key}
                className={`${styles.optionItem} ${index === checkIndex ? styles.checkedItem : ''}`}
                onClick={() => setCheckIndex(index)}
              >{item.text}</div>
            )
          })
        }
      </div>
    </div>
  )
}

export default App
