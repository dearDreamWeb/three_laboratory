import { useEffect, useRef, useCallback, useState, ChangeEvent } from 'react'
import styles from './rect.module.less'
import {
    Scene, PerspectiveCamera, WebGLRenderer, Mesh, BufferGeometry,
    LineBasicMaterial, Line, BoxBufferGeometry,
    MeshBasicMaterial, MeshLambertMaterial,
    BufferAttribute,
    DirectionalLight,
    AmbientLight,
    PlaneGeometry,
} from 'three';
import { randomColor } from '../../utils'

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
    const [dirLightIntensity, setDirLightIntensity] = useState<number>(1);
    const [pointLightIntensity, setPointLightIntensity] = useState<number>(0.4);
    // 平行光
    const dirLight = useRef<DirectionalLight>(new DirectionalLight('#ffffff', dirLightIntensity)).current;
    // 环境光
    const pointLight = useRef<AmbientLight>(new AmbientLight('#ffffff', pointLightIntensity)).current;



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

    /**
     * 创建 meshBasic 材质立方体
     */
    const createRect = useCallback(() => {
        const geometry = new BoxBufferGeometry(2, 2, 2);
        const arr = [];
        for (let i = 0; i < 6; i++) {
            const meshBasicMater = new MeshBasicMaterial({ color: randomColor() });
            arr.push(meshBasicMater)
        }
        const mesh = new Mesh(geometry, arr);
        mesh.castShadow = true;
        mesh.position.set(-4, 0, 0);
        scene.add(mesh);
        meshes.push(mesh);
    }, [])

    /**
     * 创建 line 材质立方体
     */
    const createLine = useCallback(() => {
        const lineMater = new LineBasicMaterial({ vertexColors: true });
        const geometry = new BufferGeometry();
        const vertices = [];
        const colors = [];
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * 2 - 1;
            const y = Math.random() * 2 - 1;
            const z = Math.random() * 2 - 1;
            vertices.push(x, y, z);
            colors.push(Math.random(), Math.random(), Math.random());
        }
        geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
        geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3))
        const mesh = new Line(geometry, lineMater);
        mesh.castShadow = true;
        mesh.position.set(0, 0, 0);
        scene.add(mesh);
        meshes.push(mesh);
    }, [])

    /**
     * 创建 phong 材质立方体
     */
    const createLambert = useCallback(() => {
        const geometry = new BoxBufferGeometry(2, 2, 2);
        const meshBasicMater = new MeshLambertMaterial({ color: randomColor() });
        const mesh = new Mesh(geometry, meshBasicMater);
        mesh.castShadow = true;
        mesh.position.set(4, 0, 0);
        scene.add(mesh);
        meshes.push(mesh);
    }, [])

    /**
     * 创建灯光
     */
    const createLight = useCallback(() => {
        dirLight.castShadow = true;
        dirLight.position.set(0, 200, 0);
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        scene.add(dirLight, pointLight);
        lights.push(dirLight, pointLight);
    }, [])

    const renderScene = useCallback(() => {
        render.render(scene, camera);
        meshes.forEach((item) => {
            item.rotation.x += 0.5 / 180 * Math.PI;
            item.rotation.y += 0.5 / 180 * Math.PI;
        })
        raf.current = window.requestAnimationFrame(() => renderScene());
    }, [render])

    /**
     * 创建地板
     */
    const createFloor = useCallback(() => {
        const meshBasicMater = new MeshLambertMaterial({ color: '#ffffff' });
        const plane = new PlaneGeometry(60, 60);
        const mesh = new Mesh(plane, meshBasicMater);
        mesh.receiveShadow = true;
        mesh.position.set(0, -4, 0);
        mesh.rotation.x = -90 / 180 * Math.PI;
        scene.add(mesh);
    }, [])

    /**
     * 初始化
     */
    useEffect(() => {
        body.current!.append(render.domElement);
        init();
        createLight();
        createRect();
        createLine();
        createLambert();
        createFloor();
        renderScene();
        render.domElement.addEventListener(
            'webglcontextlost',
            function (event) {
                event.preventDefault();
                setTimeout(function () {
                    render.forceContextRestore();
                }, 1000);
            },
            false
        );
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

    const DirLightIntensityChange = (e: ChangeEvent<HTMLInputElement>) => {
        dirLight.intensity = Number(e.target.value);
        setDirLightIntensity(Number(e.target.value));
    }

    const PointLightChange = (e: ChangeEvent<HTMLInputElement>) => {
        pointLight.intensity = Number(e.target.value);
        setPointLightIntensity(Number(e.target.value));
    }

    return (
        <div className={styles.rect_box}>
            <div className={styles.three_box} ref={body} onMouseDown={down} onMouseUp={up} onMouseMove={move} onWheel={wheel}></div>
            <div className={styles.options_box}>
                <div className={styles.options_item}>
                    <span className={styles.options_item_desc}>灯光强度：</span>
                    <input type="range" min={0} max={1} step={0.1} value={dirLightIntensity} onChange={DirLightIntensityChange} />
                    <div className={styles.options_item_process}>{dirLightIntensity * 100}%</div>
                </div>
                <div className={styles.options_item}>
                    <span className={styles.options_item_desc}>环境光强度：</span>
                    <input type="range" min={0} max={1} step={0.1} value={pointLightIntensity} onChange={PointLightChange} />
                    <div className={styles.options_item_process}>{pointLightIntensity * 100}%</div>
                </div>
            </div>
        </div>
    )
}

export default Stars
