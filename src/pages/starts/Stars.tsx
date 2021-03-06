import { useEffect, useRef, useCallback, useState } from 'react'
import styles from './stars.module.less'
import {
    Scene, PerspectiveCamera, WebGLRenderer, Mesh, MeshLambertMaterial, Color,
    DirectionalLight, AmbientLight, MeshPhongMaterial, RingGeometry, DoubleSide, SphereBufferGeometry
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function Stars() {
    const body = useRef<HTMLDivElement>(null)
    const scene = useRef<Scene>(new Scene()).current;
    const camera = useRef<PerspectiveCamera>(new PerspectiveCamera()).current;
    const render = useRef(new WebGLRenderer({ antialias: true })).current;
    const meshes = useRef<any[]>([]).current;
    const lights = useRef<any[]>([]).current;
    const raf = useRef<number>();
    const radius = useRef<number>(90);
    const pi = useRef<number>(15);
    const [showText, setShowText] = useState<boolean>(true);

    const init = useCallback(() => {
        render.setSize(body.current!.offsetWidth, body.current!.offsetHeight);
        render.shadowMap.enabled = true;
        camera.aspect = body.current!.offsetWidth / body.current!.offsetHeight;
        camera.fov = 45;
        camera.near = 1;
        camera.far = 1000;
        const radiusNum = radius.current / 180 * Math.PI;
        camera.position.set(pi.current * Math.cos(radiusNum), pi.current * 1.2, pi.current * Math.sin(radiusNum));
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
    }, [render, body])

    const renderScene = useCallback(() => {
        render.render(scene, camera);
        meshes.forEach((item) => {
            item.rotation.x += 0.5 / 180 * Math.PI;
            item.rotation.y += 0.3 / 180 * Math.PI;
        })
        raf.current = window.requestAnimationFrame(() => renderScene());
    }, [render])

    /**
     * 创建灯光
     */
    const createLight = useCallback(() => {
        const dirLight = new DirectionalLight('#ffffff', 1);
        const pointLight = new AmbientLight('#ffffff', 0.4);
        dirLight.castShadow = true;
        dirLight.position.set(200, 200, 200);
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        scene.add(dirLight, pointLight);
        lights.push(dirLight, pointLight);
    }, [])

    /**
     * 创建星球
     */
    const createStart = useCallback((x, y, z) => {
        // 球体
        const width = Math.random() * 1;
        const color = new Color(Math.random(), Math.random(), Math.random());
        const geometry = new SphereBufferGeometry(width, 64, 64);
        const phong = new MeshPhongMaterial({ color });
        const sphere = new Mesh(geometry, phong);
        sphere.position.set(x, y, z);

        // 星云
        const color2 = new Color(Math.random(), Math.random(), Math.random());
        const innerRadius = width * 1.2; // 星云的内环的半径 
        const outerRadius = innerRadius * 1.1; // 星云的外环的半径 
        const geometry2 = new RingGeometry(innerRadius, outerRadius, 64);
        const lambert = new MeshLambertMaterial({ color: color2, side: DoubleSide });
        const ring = new Mesh(geometry2, lambert);
        ring.position.set(x, y, z);
        const rotationX = Math.floor(Math.random() * 180) - 360;
        ring.rotation.x = rotationX / 180 * Math.PI;

        scene.add(sphere, ring);
        meshes.push(sphere, ring)
    }, [])

    /**
     * 初始化控制器
     */
    const initControls = () => {
        new OrbitControls(camera, render.domElement);
    }

    /**
     * 初始化
     */
    useEffect(() => {
        body.current!.append(render.domElement);
        init();
        initControls();
        createLight();
        renderScene();
        return () => {
            cancelAnimationFrame(raf.current!);
            meshes.forEach((item) => {
                scene.remove(item);
                item.geometry.dispose();
            })
            lights.forEach((item) => {
                scene.remove(item);
            })
            render.dispose();
        }
    }, [])


    const click = useCallback(() => {
        const x = 8 - Math.random() * 16;
        const y = 8 - Math.random() * 16;
        const z = 3 - Math.random() * 6;
        createStart(x, y, z)
        setShowText(false)
    }, [])


    return (
        <>
            <div className={styles.app} ref={body} onClick={click}></div>
            {
                showText && <div className={styles.tipBox}>鼠标点击屏幕随机生成星球</div>
            }
        </>
    )
}

export default Stars
