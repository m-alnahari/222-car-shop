import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Center, Environment, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

function Model() {
  const { scene } = useGLTF('/models/Untitled.glb')

  const group = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!group.current) return

    const mouseX = state.pointer.x
    const mouseY = state.pointer.y

    group.current.rotation.y +=
      (mouseX * 0.4 - group.current.rotation.y) * 0.04

    group.current.rotation.x +=
      (-mouseY * 0.08 - group.current.rotation.x) * 0.04
  })

  return (
    <Center>
      <group
        ref={group}
        position={[2, 0, 0]}
      >
        <primitive
          object={scene}
          scale={0.8}
          rotation={[0, -Math.PI / 2, 0]}
        />
      </group>
    </Center>
  )
}

function CarModel() {
  return (
    <div className="h-[900px] w-[900px]">
      <Canvas
        camera={{
          position: [0, 0, 6],
          fov: 35,
        }}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        <ambientLight intensity={1.5} />

        <directionalLight
          position={[5, 5, 5]}
          intensity={3}
        />

        <directionalLight
          position={[-5, 3, 4]}
          intensity={2}
        />

        <Environment preset="studio" />

        <Model />
      </Canvas>
    </div>
  )
}

useGLTF.preload('/models/Untitled.glb')

export default CarModel