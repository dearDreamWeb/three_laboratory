import { useEffect, useRef, useCallback, useState, ChangeEvent } from 'react'
import styles from './loader.module.less'
import {
    Scene, PerspectiveCamera, WebGLRenderer, Mesh, BufferGeometry,
    LineBasicMaterial, Line, BoxBufferGeometry,
    MeshBasicMaterial, MeshLambertMaterial,
    BufferAttribute,
    DirectionalLight,
    AmbientLight,
    PlaneGeometry,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

function Loader() {
    const body = useRef<HTMLDivElement>(null)
    const scene = useRef<Scene>(new Scene()).current;
    const camera = useRef<PerspectiveCamera>(new PerspectiveCamera()).current;
    const render = useRef(new WebGLRenderer({ antialias: true })).current;
    const meshes = useRef<any[]>([]).current;
    const lights = useRef<any[]>([]).current;
    const raf = useRef<number>();

    // 平行光
    const dirLight = useRef<DirectionalLight>(new DirectionalLight('#ffffff', 1.0)).current;
    // 环境光
    const pointLight = useRef<AmbientLight>(new AmbientLight('#ffffff', 1.0)).current;



    const init = useCallback(() => {
        render.setSize(body.current!.offsetWidth, body.current!.offsetHeight);
        render.shadowMap.enabled = true;
        camera.aspect = body.current!.offsetWidth / body.current!.offsetHeight;
        camera.fov = 45;
        camera.near = 1;
        camera.far = 1000;
        camera.position.set(50, 10, 0);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
    }, [render, body])

    /**
     * 创建灯光
     */
    const createLight = useCallback(() => {
        dirLight.castShadow = true;
        dirLight.position.set(5, 10, 10);
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
     * 初始化控制器
     */
    const initControls = () => {
        new OrbitControls(camera, render.domElement);
    }

    
    /**
     * 加载模型
     */
    const loaderFbx = useCallback(() => {
        const loader = new FBXLoader();
        loader.load('/loaders/HumanMechanic.fbx', (obj) => {
            obj.position.set(0, 0, 0);
            obj.scale.set(0.1, 0.1, 0.1);
            scene.add(obj);
        })
    }, [])

    /**
     * 初始化
     */
    useEffect(() => {
        body.current!.append(render.domElement);
        init();
        initControls();
        createLight();
        createFloor();
        loaderFbx();
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

    return (
        <div className={styles.rect_box}>
            <div className={styles.three_box} ref={body}></div>
        </div>
    )
}

export default Loader
