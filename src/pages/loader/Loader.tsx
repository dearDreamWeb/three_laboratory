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
import starPlane from '../../assets/images/starPlane.jpg';
import ceiling from '../../assets/images/ceiling.jpg';
import snowImg from '../../assets/images/snow.png';

interface CreateFloorProps {
    position: { x: number; y: number; z: number };
    rotateX?: number;
    rotateY?: number;
    width: number;
    height: number;
    textureImage: string;
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
    const meshes = useRef<any[]>([]).current;
    const snowClass = useRef<any[]>([]).current;

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
        camera.position.set(0, 40, 100);
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
        meshes.forEach((item, index) => {
            if (item.name === 'snow') {
                const { x, y, z } = item.position;
                const { xSpeed, ySpeed, zSpeed, xRotate, yRotate } = item.baseInfo;
                if (y > 0) {
                    item.position.set(x - xSpeed, y - ySpeed, z - zSpeed);
                    item.rotation.x += xRotate;
                    item.rotation.y += yRotate;
                } else {
                    // 当y<0说明雪花落地了，初始化数据
                    snowClass[index].init();
                }
            }
        })
        const time = clock.current.getDelta();
        if (mixer.current) {
            mixer.current.update(time);
        }
        raf.current = window.requestAnimationFrame(() => renderScene());
    }, [render])

    /**
     * 创建地板
     */
    const createFloor = useCallback(({ position, rotateX, rotateY, width, height, textureImage }: CreateFloorProps) => {
        const plane = new PlaneGeometry(width, height); //矩形平面
        const texture = ImageUtils.loadTexture(textureImage); //加载纹理贴图
        const meshBasicMater = new MeshLambertMaterial({ map: texture, side: DoubleSide });
        const mesh = new Mesh(plane, meshBasicMater);
        mesh.receiveShadow = true;
        mesh.position.set(position.x, position.y, position.z);
        mesh.rotation.x = (rotateX || 0) / 180 * Math.PI;
        mesh.rotation.y = (rotateY || 0) / 180 * Math.PI;
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
            // 播放音乐
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
            obj.scale.set(0.2, 0.2, 0.2);
            mixer.current = new AnimationMixer(obj);
            const animated = mixer.current.clipAction(obj.animations[1]);
            animated.setLoop(true);
            animated.play();
            scene.add(obj);
        }, modelProgress)
    }, [])

    /**
     * 随机数
     * @param min 
     * @param max 
     * @returns 
     */
    const randomRange = (min: number, max: number): number => {
        return Math.random() * (max - min) + min;
    }

    /**
     * 下雪
     */
    const snowPlay = useCallback(() => {
        const snow = new PlaneGeometry(1, 1); //矩形平面
        const texture = ImageUtils.loadTexture(snowImg); //加载纹理贴图
        texture.repeat.set(1, 1);
        const meshBasicMater = new MeshLambertMaterial({ map: texture, side: DoubleSide, transparent: true });
        for (let i = 0; i < 1000; i++) {
            const snowTexture = new SnowTexture(snow, meshBasicMater);
            snowClass.push(snowTexture)
        }
    }, [])

    /**
     * 雪花
     */
    class SnowTexture {
        mesh: any;
        constructor(snow: PlaneGeometry, meshBasicMater: MeshLambertMaterial) {
            this.mesh = new Mesh(snow, meshBasicMater);
            this.mesh.name = 'snow'
            this.mesh.receiveShadow = true;
            this.init();
            meshes.push(this.mesh);
            scene.add(this.mesh);
        }
        init() {
            const x = randomRange(-50, 50);
            const y = randomRange(40, 50);
            const z = randomRange(-50, 50);
            const xSpeed = randomRange(-0.1, 0.1)
            const ySpeed = randomRange(0.1, 0.3)
            const zSpeed = randomRange(-0.1, 0.1)
            const xRotate = randomRange(0, 0.1);
            const yRotate = randomRange(0, 0.5);
            this.mesh.position.set(x, y, z);
            this.mesh.baseInfo = {
                originX: x,
                originY: y,
                originZ: z,
                xSpeed,
                ySpeed,
                zSpeed,
                xRotate,
                yRotate
            }

        }
    }

    /**
     * 初始化
     */
    useEffect(() => {
        body.current!.append(render.domElement);
        init();
        initControls();
        createLight();
        // 地板
        createFloor({
            position: { x: 0, y: 0, z: 0 },
            rotateX: -90,
            width: 100,
            height: 100,
            textureImage: ceiling
        });
        // 背景板
        createFloor({
            position: { x: 0, y: 30, z: -50 },
            rotateX: 0,
            width: 100,
            height: 60,
            textureImage: starPlane
        });
        // 左侧墙板
        createFloor({
            position: { x: -50, y: 30, z: 0 },
            rotateY: -90,
            width: 100,
            height: 60,
            textureImage: ceiling
        });
        // 右侧墙板
        createFloor({
            position: { x: 50, y: 30, z: 0 },
            rotateY: -90,
            width: 100,
            height: 60,
            textureImage: ceiling
        });
        loaderFbx();
        snowPlay();
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
            <audio src='https://cdn2.mihuiai.com/yang.mp3' loop ref={audioRef}></audio>
            {
                !isLoadSuccess && (
                    <div className={styles.model_progress}>模型文件稍大，请耐心等待，模型加载中...</div>
                )
            }
        </div>
    )
}

export default Loader
