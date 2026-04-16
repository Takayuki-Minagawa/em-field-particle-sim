import { OrbitControls, Line, Text } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { particleLabel } from '../data/presets';
import type { Fields, Language, ParticleState } from '../lib/types';
import { magnitude, normalize } from '../lib/vector';

type SimulationSceneProps = {
  language: Language;
  fields: Fields;
  particles: ParticleState[];
  activeParticleId: string;
  cameraFollow: boolean;
  cameraResetToken: number;
};

type ArrowGlyphProps = {
  origin: [number, number, number];
  vector: { x: number; y: number; z: number };
  color: string;
  scaleFactor?: number;
  opacity?: number;
};

function ArrowGlyph({
  origin,
  vector,
  color,
  scaleFactor = 1,
  opacity = 1,
}: ArrowGlyphProps) {
  const length = Math.max(magnitude(vector) * scaleFactor, 0);
  if (length < 0.02) {
    return null;
  }

  const direction = normalize(vector);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(direction.x, direction.y, direction.z),
  );
  const shaftLength = Math.max(length * 0.74, 0.02);
  const headLength = Math.max(length - shaftLength, 0.12);

  return (
    <group position={origin} quaternion={quaternion}>
      <mesh position={[0, shaftLength / 2, 0]}>
        <cylinderGeometry args={[0.035, 0.035, shaftLength, 8]} />
        <meshStandardMaterial color={color} opacity={opacity} transparent />
      </mesh>
      <mesh position={[0, shaftLength + headLength / 2, 0]}>
        <coneGeometry args={[0.12, headLength, 10]} />
        <meshStandardMaterial color={color} opacity={opacity} transparent />
      </mesh>
    </group>
  );
}

function FieldArrows({
  vector,
  density,
  color,
  scaleFactor,
}: {
  vector: Fields['electric'];
  density: number;
  color: string;
  scaleFactor: number;
}) {
  const span = 4.5;
  const coordinates = Array.from({ length: density }, (_, index) =>
    density === 1
      ? 0
      : -span + (index * (span * 2)) / Math.max(density - 1, 1),
  );

  return (
    <group>
      {coordinates.flatMap((x) =>
        coordinates.flatMap((y) =>
          coordinates.map((z) => (
            <ArrowGlyph
              color={color}
              key={`${x}-${y}-${z}-${color}`}
              opacity={0.3}
              origin={[x, y, z]}
              scaleFactor={scaleFactor}
              vector={vector}
            />
          )),
        ),
      )}
    </group>
  );
}

function ParticleTrail({
  trail,
  color,
}: {
  trail: ParticleState['trail'];
  color: string;
}) {
  if (trail.length < 2) {
    return null;
  }

  const points = trail.map((point) => [point.x, point.y, point.z] as [number, number, number]);
  const colors = trail.flatMap((_, index) => {
    const tint = index / Math.max(trail.length - 1, 1);
    const mixed = new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 1 - tint);
    return [mixed.toArray() as [number, number, number]];
  });

  return (
    <Line
      lineWidth={2.4}
      points={points}
      transparent
      vertexColors={colors}
    />
  );
}

function CameraRig({
  activeParticle,
  cameraFollow,
  cameraResetToken,
}: {
  activeParticle: ParticleState | undefined;
  cameraFollow: boolean;
  cameraResetToken: number;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  useEffect(() => {
    camera.position.set(10, 8, 10);
    camera.lookAt(0, 0, 0);
    controlsRef.current?.target.set(0, 0, 0);
    controlsRef.current?.update();
  }, [camera, cameraResetToken]);

  useFrame(() => {
    if (!cameraFollow || !activeParticle) {
      return;
    }

    const target = new THREE.Vector3(
      activeParticle.position.x,
      activeParticle.position.y,
      activeParticle.position.z,
    );
    const desired = target.clone().add(new THREE.Vector3(4.6, 3.7, 4.8));
    camera.position.lerp(desired, 0.05);
    controlsRef.current?.target.lerp(target, 0.08);
    controlsRef.current?.update();
  });

  return <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.08} />;
}

function CyclotronGuide({
  particle,
  magnetic,
}: {
  particle: ParticleState | undefined;
  magnetic: Fields['magnetic'];
}) {
  if (!particle?.cyclotronRadius || magnitude(magnetic) < 1e-4) {
    return null;
  }

  const direction = normalize(magnetic);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(direction.x, direction.y, direction.z),
  );

  return (
    <group
      position={[
        particle.position.x,
        particle.position.y,
        particle.position.z,
      ]}
      quaternion={quaternion}
    >
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[particle.cyclotronRadius, 0.02, 8, 72]} />
        <meshStandardMaterial color="#ffb84d" opacity={0.55} transparent />
      </mesh>
    </group>
  );
}

function SceneContent({
  language,
  fields,
  particles,
  activeParticleId,
  cameraFollow,
  cameraResetToken,
}: SimulationSceneProps) {
  const activeParticle = particles.find((particle) => particle.id === activeParticleId);
  const fieldScale = fields.scaleMode === 'teaching' ? 0.4 : 0.24;

  return (
    <>
      <color attach="background" args={['#08131f']} />
      <fog attach="fog" args={['#08131f', 12, 24]} />
      <ambientLight intensity={0.8} />
      <directionalLight color="#fff5d6" intensity={1.4} position={[7, 8, 6]} />
      <pointLight color="#8ce6ff" intensity={1.2} position={[-6, 5, -5]} />
      <gridHelper args={[20, 20, '#32516c', '#153247']} position={[0, -4.6, 0]} />
      <axesHelper args={[3]} />
      <FieldArrows
        color="#28b9ff"
        density={fields.density}
        scaleFactor={fieldScale}
        vector={fields.electric}
      />
      <FieldArrows
        color="#ffb84d"
        density={fields.density}
        scaleFactor={fieldScale}
        vector={fields.magnetic}
      />

      {particles.map((particle) => (
        <group key={particle.id}>
          <ParticleTrail color={particle.color} trail={particle.trail} />
          <mesh
            position={[
              particle.position.x,
              particle.position.y,
              particle.position.z,
            ]}
          >
            <sphereGeometry
              args={[particle.id === activeParticleId ? 0.24 : 0.18, 24, 24]}
            />
            <meshStandardMaterial color={particle.color} emissive={particle.color} emissiveIntensity={0.18} />
          </mesh>
          <Text
            anchorX="center"
            anchorY="bottom"
            color="#f6fbff"
            fontSize={0.32}
            position={[
              particle.position.x,
              particle.position.y + 0.42,
              particle.position.z,
            ]}
          >
            {particleLabel(particle, language)}
          </Text>
        </group>
      ))}

      {activeParticle && (
        <>
          <ArrowGlyph
            color="#28b9ff"
            origin={[
              activeParticle.position.x,
              activeParticle.position.y,
              activeParticle.position.z,
            ]}
            scaleFactor={0.55}
            vector={activeParticle.velocity}
          />
          <ArrowGlyph
            color="#ff6b57"
            origin={[
              activeParticle.position.x,
              activeParticle.position.y,
              activeParticle.position.z,
            ]}
            scaleFactor={0.22}
            vector={activeParticle.force}
          />
          <CyclotronGuide magnetic={fields.magnetic} particle={activeParticle} />
        </>
      )}

      <CameraRig
        activeParticle={activeParticle}
        cameraFollow={cameraFollow}
        cameraResetToken={cameraResetToken}
      />
    </>
  );
}

export function SimulationScene(props: SimulationSceneProps) {
  return (
    <div className="scene-shell">
      <Canvas camera={{ fov: 48, position: [10, 8, 10] }}>
        <SceneContent {...props} />
      </Canvas>
    </div>
  );
}
