import { useEffect, useRef, useCallback } from 'react'
import styles from '../app.module.less'
import {
    Scene, PerspectiveCamera, WebGLRenderer, Mesh, BufferGeometry,
    LineBasicMaterial, Line, BoxBufferGeometry,
    MeshBasicMaterial, MeshLambertMaterial,
    Color,
    BufferAttribute,
    DirectionalLight,
    AmbientLight,
    PlaneGeometry,
    MeshPhongMaterial,
    RingGeometry,
    DoubleSide,
    SphereBufferGeometry
} from 'three';

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

    const init = useCallback(() => {
        render.setSize(body.current!.offsetWidth, body.current!.offsetHeight);
        render.shadowMap.enabled = true;
        camera.aspect = body.current!.offsetWidth / body.current!.offsetHeight;
        camera.fov = 45;
        camera.near = 1;
        camera.far = 1000;
        camera.position.set(0, 3, pi.current);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
    }, [render, body])

    const renderScene = useCallback(() => {
        render.render(scene, camera);
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
    }, [])

    /**
     * 初始化
     */
    useEffect(() => {
        body.current!.append(render.domElement);
        init();
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

    const isDown = useRef<boolean>(false);
    const down = useCallback(() => isDown.current = true, [])
    const up = useCallback(() => isDown.current = false, [])
    const move = useCallback((e) => {
        if (!isDown.current) {
            return false;
        }
        const { y } = camera.position;
        radius.current -= e.movementX * 0.5;
        const newX = pi.current * Math.cos(radius.current / 180 * Math.PI);
        const newY = y + e.movementY * 0.1;
        const newZ = pi.current * Math.sin(radius.current / 180 * Math.PI);
        camera.position.set(newX, newY, newZ);
        camera.lookAt(0, 0, 0);
    }, [])

    const wheel = useCallback((e) => {
        if (e.deltaY > 0) {
            pi.current++;
        } else if (e.deltaY < 0) {
            pi.current--;
        }
        const { y } = camera.position;
        radius.current -= e.movementX * 0.5;
        const newX = pi.current * Math.cos(radius.current / 180 * Math.PI);
        const newY = y + e.movementY * 0.1;
        const newZ = pi.current * Math.sin(radius.current / 180 * Math.PI);
        camera.position.set(newX, newY, newZ);
        camera.lookAt(0, 0, 0);
    }, [])

    const click = useCallback(() => {
        const x = 10 - Math.random() * 20;
        const y = 10 - Math.random() * 20;
        const z = 5 - Math.random() * 10;
        createStart(x, y, z)
    }, [])


    return (
        <div className={styles.app} ref={body} onMouseDown={down} onMouseUp={up} onMouseMove={move} onWheel={wheel} onClick={click}></div>
    )
}

export default Stars
