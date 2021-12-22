import { useRef, useCallback, useEffect } from 'react';
import {
    Scene, PerspectiveCamera, WebGLRenderer, Mesh, MeshLambertMaterial, Color,
    DirectionalLight, AmbientLight, MeshPhongMaterial, RingGeometry, DoubleSide, MeshBasicMaterial,
    SphereBufferGeometry, Line, PointLight, LineSegments, BufferGeometry, BufferAttribute, LineBasicMaterial,
    SpotLight, TextureLoader, PointsMaterial, Vector3, Points
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import sunTexture from '../../assets/images/sun.jpg';  // 太阳
import mercuryTexture from '../../assets/images/mercury.jpg'; // 水星
import venusTexture from '../../assets/images/venus.jpg';  // 金星
import earthTexture from '../../assets/images/earth.jpg';   // 地球
import marsTexture from '../../assets/images/mars.jpg';    // 火星
import jupiterTexture from '../../assets/images/jupiter.jpg'; // 木星
import saturnTexture from '../../assets/images/saturn.jpg'; // 土星
import uranusTexture from '../../assets/images/uranus.jpg'; // 天王星
import neptuneTexture from '../../assets/images/neptune.jpg'; // 海王星

const SolarSystem = () => {
    const body = useRef<HTMLDivElement>(null)
    const scene = useRef<Scene>(new Scene()).current;
    const camera = useRef<PerspectiveCamera>(new PerspectiveCamera()).current;
    const render = useRef(new WebGLRenderer({ antialias: true })).current;
    const meshes = useRef<any[]>([]).current;
    const lights = useRef<any[]>([]).current;
    const raf = useRef<number>();
    const startData = useRef<any>({})

    const init = useCallback(() => {
        render.setSize(body.current!.offsetWidth, body.current!.offsetHeight);
        render.shadowMap.enabled = true;
        camera.aspect = body.current!.offsetWidth / body.current!.offsetHeight;
        // camera.fov = 100;
        // camera.near = 1;
        // camera.far = 1000;
        camera.position.set(130, 80, 0);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
    }, [render, body])

    /**
     * 初始化星空
     */
    const initStarField = () => {
        const starsMaterial = new PointsMaterial();
        let starsGeometry = new BufferGeometry();
        let star = [];
        let colorArr = [];
        let sizeArr = [];
        for (let i = 0; i < 10000; i++) {
            star.push(getRange(-2000, 2000), getRange(-2000, 2000), getRange(-2000, 2000))
            colorArr.push(getRange(0, 255),getRange(0, 255),getRange(0, 255));
            sizeArr.push(getRange(5, 6))
        }
        starsGeometry.setAttribute('position', new BufferAttribute(new Float32Array(star), 3))
        starsGeometry.setAttribute('color', new BufferAttribute(new Float32Array(colorArr), 3))
        starsGeometry.setAttribute('size', new BufferAttribute(new Float32Array(sizeArr), 1))
        let starField = new Points(starsGeometry, starsMaterial);
        scene.add(starField);
    }

    const getRange = (min: number, max: number): number => {
        return Math.random() * min + Math.random() * (max - min);
    }

    const renderScene = useCallback(() => {
        render.render(scene, camera);
        meshes.forEach((item) => {
            const { y } = item.position;
            const { distance, angle, speed } = startData.current[item.id];
            item.material.opacity = 0.1;
            startData.current[item.id].angle += speed;
            item.position.set(distance * Math.sin(angle / 180 * Math.PI), y, distance * Math.cos(angle / 180 * Math.PI))
        })
        raf.current = window.requestAnimationFrame(() => renderScene());
    }, [render])

    /**
     * 创建灯光
     */
    const createLight = useCallback(() => {
        // 灯光
        const pointLight = new AmbientLight('#ffffff', 1);
        // 环境光
        const dirLight = new SpotLight('#ffffff', 0.8, 0, Math.PI);
        dirLight.castShadow = true;
        dirLight.position.set(0, 3, 0);
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
    const createStar = useCallback((x, y, z, r, speed, img, isRing?: boolean) => {
        const texture = new TextureLoader().load(img);
        // 球体
        const width = r;
        // const color = new Color(Math.random(), Math.random(), Math.random());
        const geometry = new SphereBufferGeometry(width, 64, 64);
        const phong = new MeshPhongMaterial({ map: texture });
        const sphere = new Mesh(geometry, phong);
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        sphere.position.set(x, y, z);
        startData.current[sphere.id] = {
            angle: Math.atan(z / x || 0),
            distance: Math.sqrt(Math.pow(x, 2) + Math.pow(z, 2)),
            speed
        }
        const distance = Math.sqrt(Math.pow(x, 2) + Math.pow(z, 2));

        /*轨道*/
        let track = new Mesh(new RingGeometry(distance - 0.05, distance + 0.05, 64, 1),
            new MeshLambertMaterial({ color: 0x888888, side: DoubleSide })
        );
        track.rotation.x = - Math.PI / 2;

        // 星云
        if (isRing) {
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
                distance,
                speed
            }
            scene.add(sphere, track, ring);
            meshes.push(sphere, ring)
        } else {
            scene.add(sphere, track);
            meshes.push(sphere)
        }

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
        initStarField();
        initControls();
        createLight();
        renderScene();
        // x,y,z轴
        // originLine(15, 0, 0, 'yellow');
        // originLine(0, 15, 0, 'red');
        // originLine(0, 0, 15, 'green');

        // 太阳
        createStar(0, 0, 0, -10, 1, sunTexture)
        // 水星
        createStar(0, 0, -15, 0.6, 0.03, mercuryTexture)
        // 金星
        createStar(0, 0, -20, 2, 0.04, venusTexture)
        // 地球
        createStar(0, 0, -25, 2.1, 0.045, earthTexture)
        // 火星
        createStar(0, 0, -30, 0.9, 0.09, marsTexture)
        // 木星
        createStar(0, 0, -40, 5, 0.1, jupiterTexture)
        // 土星
        createStar(0, 0, -55, 4.5, 0.18, saturnTexture, true)
        // 天王星
        createStar(0, 0, -65, 2, 0.05, uranusTexture)
        // 海王星
        createStar(0, 0, -75, 2, 1, neptuneTexture)


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

    return <div style={{ width: '100%', height: '100%' }} ref={body} ></div>
}

export default SolarSystem;
