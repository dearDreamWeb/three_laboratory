import { useRef, useCallback, useEffect } from 'react';
import {
    Scene, PerspectiveCamera, WebGLRenderer, Mesh, MeshLambertMaterial, Color,
    DirectionalLight, AmbientLight, MeshPhongMaterial, RingGeometry, DoubleSide,MeshBasicMaterial,
    SphereBufferGeometry, Line, PointLight, LineSegments, BufferGeometry, BufferAttribute, LineBasicMaterial
} from 'three';

const SolarSystem = () => {
    const body = useRef<HTMLDivElement>(null)
    const scene = useRef<Scene>(new Scene()).current;
    const camera = useRef<PerspectiveCamera>(new PerspectiveCamera()).current;
    const render = useRef(new WebGLRenderer({ antialias: true })).current;
    const meshes = useRef<any[]>([]).current;
    const lights = useRef<any[]>([]).current;
    const raf = useRef<number>();
    const radius = useRef<number>(0);
    const pi = useRef<number>(15);
    const startData = useRef<any>({})

    const init = useCallback(() => {
        render.setSize(body.current!.offsetWidth, body.current!.offsetHeight);
        render.shadowMap.enabled = true;
        camera.aspect = body.current!.offsetWidth / body.current!.offsetHeight;
        camera.fov = 60;
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
            const { y } = item.position;
            const { distance, angle, speed } = startData.current[item.id];
            startData.current[item.id].angle += speed;
            item.position.set(distance * Math.cos(angle / 180 * Math.PI), y, distance * Math.sin(angle / 180 * Math.PI))
        })
        raf.current = window.requestAnimationFrame(() => renderScene());
    }, [render])

    /**
     * 创建灯光
     */
    const createLight = useCallback(() => {
        // 灯光
        const dirLight = new PointLight('#ffffff', 1.5, 100, 2);
        // 环境光
        const pointLight = new AmbientLight('#ffffff', 0.5);
        dirLight.castShadow = true;
        dirLight.position.set(0, 0, 0);
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        scene.add(dirLight, pointLight);
        lights.push(dirLight, pointLight);
    }, [])

    /**
     * 创建星球
     * r: 半径
     * speed: 公转的速度
     */
    const createStart = useCallback((x, y, z, r, speed) => {
        // 球体
        const width = r;
        const color = new Color(Math.random(), Math.random(), Math.random());
        const geometry = new SphereBufferGeometry(width, 64, 64);
        const phong = new MeshPhongMaterial({ color });
        const sphere = new Mesh(geometry, phong);
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        sphere.position.set(x, y, z);
        startData.current[sphere.id] = {
            angle: Math.atan(z / x || 0),
            distance: Math.sqrt(Math.pow(x, 2) + Math.pow(z, 2)),
            speed
        }
        // 星云
        const color2 = new Color(Math.random(), Math.random(), Math.random());
        const innerRadius = width * 1.2; // 星云的内环的半径 
        const outerRadius = innerRadius * 1.1; // 星云的外环的半径 
        const geometry2 = new RingGeometry(innerRadius, outerRadius, 64);
        const lambert = new MeshLambertMaterial({ color: color2, side: DoubleSide });
        const ring = new Mesh(geometry2, lambert);
        ring.castShadow = true;
        ring.receiveShadow = true;
        ring.position.set(x, y, z);
        const rotationX = 90;
        ring.rotation.x = rotationX / 180 * Math.PI;

        startData.current[ring.id] = {
            angle: Math.atan(z / x || 0),
            distance: Math.sqrt(Math.pow(x, 2) + Math.pow(z, 2)),
            speed
        }
        scene.add(sphere, ring);
        meshes.push(sphere, ring)
    }, [])

    // 线段
    const originLine = (x: number, y: number, z: number, color: string) => {
        const geometry = new BufferGeometry();
        const vertices = [0, 0, 0, x, y, z]
        geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
        const material = new LineBasicMaterial({
            color
        });
        const line = new LineSegments(geometry, material);
        scene.add(line);
    }

    /**
     * 初始化
     */
    useEffect(() => {
        body.current!.append(render.domElement);
        init();
        createLight();
        renderScene();
        originLine(8, 0, 0, 'yellow');
        originLine(0, 8, 0, 'red');
        originLine(0, 0, 8, 'green');
        const x = 0;
        const y = 0;
        const z = 0;
        // createStart(x, y, z, 2, 1)
        createStart(5, 0, 5, 0.8, 1)
        createStart(10, 0, 10, 2, 1.2)
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
    /**
     * 左右旋转
     */
    const move = useCallback((e) => {
        if (!isDown.current) {
            return false;
        }
        const { y } = camera.position;
        radius.current += e.movementX * 0.5;
        const newX = pi.current * Math.cos(radius.current / 180 * Math.PI);
        const newY = y + e.movementY * 0.1;
        const newZ = pi.current * Math.sin(radius.current / 180 * Math.PI);
        camera.position.set(newX, newY, newZ);
        camera.lookAt(0, 0, 0);
    }, [])

    /**
     * 滑轮放大缩小
     */
    const wheel = useCallback((e) => {
        if (e.deltaY > 0) {
            camera.fov -= (camera.near < camera.fov ? 1 : 0);
        } else if (e.deltaY < 0) {
            camera.fov += (camera.fov < camera.far ? 1 : 0);
        }
        camera.updateProjectionMatrix();
        render.render(scene, camera);
    }, [])

    return <div style={{ width: '100%', height: '100%' }} ref={body} onMouseDown={down} onMouseUp={up} onMouseMove={move} onWheel={wheel}></div>
}

export default SolarSystem;
