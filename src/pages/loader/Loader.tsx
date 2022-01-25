import { useEffect, useRef, useCallback, useState, ChangeEvent, useMemo } from 'react'
import styles from './loader.module.less'
import {
    Scene, PerspectiveCamera, WebGLRenderer, Mesh, Clock,
    AnimationMixer, ImageUtils, SpotLight,
    MeshBasicMaterial, MeshLambertMaterial,
    BufferAttribute, DoubleSide,
    DirectionalLight,
    AmbientLight,
    PlaneGeometry,
    Vector3,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import planeTexture from '../../assets/images/plane.jpg';
import starPlane from '../../assets/images/starPlane.gif';
import yangMp3 from '../../assets/videos/yang.mp3';

interface CreateFloorProps {
    position: { x: number; y: number; z: number };
    rotate: number;
    width: number;
    height: number;
    textureImage?: string;
}

function Loader() {
    const body = useRef<HTMLDivElement>(null)
    const scene = useRef<Scene>(new Scene()).current;
    const camera = useRef<PerspectiveCamera>(new PerspectiveCamera()).current;
    const render = useRef(new WebGLRenderer({ antialias: true })).current;
    const lights = useRef<any[]>([]).current;
    const raf = useRef<number>();
    const clock = useRef<Clock>(new Clock())
    const mixer = useRef<any>();
    const audioRef = useRef<any>();

    const [isLoadSuccess, setIsLoadSuccess] = useState<boolean>(false);

    // 平行光
    const dirLight = useRef<DirectionalLight>(new DirectionalLight('rgba(255,255,255,0.5)')).current;
    // 环境光
    const pointLight = useRef<AmbientLight>(new AmbientLight('#ffffff', 1.0)).current;



    const init = useCallback(() => {
        render.setSize(body.current!.offsetWidth, body.current!.offsetHeight);
        render.shadowMap.enabled = true;
        camera.aspect = body.current!.offsetWidth / body.current!.offsetHeight;
        camera.fov = 45;
        camera.near = 1;
        camera.far = 1000;
        camera.position.set(0, 30, 50);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
    }, [render, body])

    /**
     * 创建灯光
     */
    const createLight = useCallback(() => {
        dirLight.castShadow = true;
        dirLight.position.set(5, 30, 10);
        dirLight.shadow.mapSize.width = 10;
        dirLight.shadow.mapSize.height = 10;
        scene.add(dirLight, pointLight);
        lights.push(dirLight, pointLight);
    }, [])

    const renderScene = useCallback(() => {
        render.render(scene, camera);
        const time = clock.current.getDelta();
        if (mixer.current) {
            mixer.current.update(time);
        }
        raf.current = window.requestAnimationFrame(() => renderScene());
    }, [render])

    /**
     * 创建地板
     */
    const createFloor = useCallback(({ position, rotate, width, height, textureImage }: CreateFloorProps) => {
        const plane = new PlaneGeometry(width, height); //矩形平面
        const texture = ImageUtils.loadTexture(textureImage || planeTexture); //加载纹理贴图
        const meshBasicMater = new MeshLambertMaterial({ map: texture, side: DoubleSide });
        const mesh = new Mesh(plane, meshBasicMater);
        mesh.receiveShadow = true;
        mesh.position.set(position.x, position.y, position.z);
        mesh.rotation.x = rotate / 180 * Math.PI;
        scene.add(mesh);
    }, [])

    /**
     * 初始化控制器
     */
    const initControls = () => {
        new OrbitControls(camera, render.domElement);
    }

    /**
     * 模型加载进度
     */
    const modelProgress = (progress: ProgressEvent<EventTarget>) => {
        const { loaded, total } = progress;
        const rate = (loaded / total * 100).toFixed(2);
        if (Number(rate) >= 100) {
            audioRef.current.play();
            setIsLoadSuccess(true);
        }
    }

    /**
     * 加载模型
     */
    const loaderFbx = useCallback(() => {
        const loader = new FBXLoader();
        loader.load('https://cdn2.mihuiai.com/monsterModel.fbx', (obj) => {
            obj.position.set(0, 0, 0);
            obj.scale.set(0.1, 0.1, 0.1);
            mixer.current = new AnimationMixer(obj);
            const animated = mixer.current.clipAction(obj.animations[1]);
            animated.setLoop(true);
            animated.play();
            scene.add(obj);
        }, modelProgress)
    }, [])

    /**
     * 初始化
     */
    useEffect(() => {
        body.current!.append(render.domElement);
        init();
        initControls();
        createLight();
        createFloor({
            position: { x: 0, y: 0, z: 0 },
            rotate: -90,
            width: 100,
            height: 100,
        });
        createFloor({
            position: { x: 0, y: 15, z: -50 },
            rotate: 0,
            width: 100,
            height: 30,
            textureImage: starPlane
        });
        loaderFbx();
        renderScene();
        return () => {
            cancelAnimationFrame(raf.current!);

            lights.forEach((item) => {
                scene.remove(item);
            })
            render.dispose();
        }
    }, [])

    return (
        <div className={styles.rect_box}>
            <div className={styles.three_box} ref={body}></div>
            <audio src={yangMp3} loop ref={audioRef}></audio>
            {
                !isLoadSuccess && (
                    <div className={styles.model_progress}>模型文件稍大，请耐心等待，模型加载中...</div>
                )
            }
        </div>
    )
}

export default Loader
