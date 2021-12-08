import { useState, useEffect, useRef, useCallback } from 'react'
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

  /**
   * 创建 meshBasic 材质立方体
   */
  const createRect = useCallback((x, y, z, color) => {
    const width = Math.random() * 5;
    const geometry = new BoxBufferGeometry(width, width, width);
    const arr = [];
    for (let i = 0; i < 6; i++) {
      const meshBasicMater = new MeshBasicMaterial({ color });
      arr.push(meshBasicMater)
    }
    const mesh = new Mesh(geometry, arr);
    mesh.castShadow = true;
    mesh.position.set(x, y, z);
    scene.add(mesh);
    meshes.push(mesh);
  }, [])

  /**
   * 创建 line 材质立方体
   */
  const createLine = useCallback((x, y, z) => {
    const lineMater = new LineBasicMaterial({ vertexColors: true });
    const geometry = new BufferGeometry();
    const vertices = [];
    const colors = [];
    const width = Math.random() * 5;
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * width - width * 0.5;
      const y = Math.random() * width - width * 0.5;
      const z = Math.random() * width - width * 0.5;
      vertices.push(x, y, z);
      colors.push(Math.random(), Math.random(), Math.random());
    }
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
    geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3))
    const mesh = new Line(geometry, lineMater);
    mesh.castShadow = true;
    mesh.position.set(x, y, z);
    scene.add(mesh);
    meshes.push(mesh);
  }, [])

  /**
   * 创建 phong 材质立方体
   */
  const createLambert = useCallback((x, y, z, color) => {
    const width = Math.random() * 5;
    const geometry = new BoxBufferGeometry(width, width, width);
    const meshBasicMater = new MeshLambertMaterial({ color });
    const mesh = new Mesh(geometry, meshBasicMater);
    mesh.castShadow = true;
    mesh.position.set(x, y, z);
    scene.add(mesh);
    meshes.push(mesh);
  }, [])

  /**
   * 创建灯光
   */
  const createLight = useCallback(() => {
    const dirLight = new DirectionalLight('#ffffff', 1);
    const pointLight = new AmbientLight('#ffffff', 0.4);
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
   * 创建星球
   */
  const createStart = useCallback((x, y, z) => {
    // 球体
    const width = Math.random() * 2;
    const color = new Color(Math.random(), Math.random(), Math.random());
    const geometry = new SphereBufferGeometry(width, 64, 64);
    const phong = new MeshPhongMaterial({ color });
    const sphere = new Mesh(geometry, phong);
    sphere.position.set(x, y, z);

    // 星云
    const color2 = new Color(Math.random(), Math.random(), Math.random());
    const geometry2 = new RingGeometry(width + 0.5, width + 0.2, 64);
    const lambert = new MeshLambertMaterial({ color: color2, side: DoubleSide });
    const ring = new Mesh(geometry2, lambert);
    ring.position.set(x, y, z);
    const rotationX = Math.floor(Math.random() * 90) - 180;
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

  const click = useCallback((e) => {
    const arr = [createRect, createLine, createLambert];
    const index = Math.floor(Math.random() * 3);
    const x = 20 - Math.random() * 40;
    const y = 10 - Math.random() * 20;
    const z = 15 - Math.random() * 30;
    const color = new Color(Math.random(), Math.random(), Math.random())
    // arr[index](x, y, z, color);
    createStart(x, y, z)
  }, [])


  return (
    <div className={styles.app} ref={body} onMouseDown={down} onMouseUp={up} onMouseMove={move} onWheel={wheel} onClick={click}></div>
  )
}

export default Stars
