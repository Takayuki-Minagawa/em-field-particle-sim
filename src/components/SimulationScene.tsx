import { OrbitControls, Line, Text } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { SCENE_COLORS } from '../data/colors';
import { particleLabel } from '../data/presets';
import type { MissionTarget } from '../lib/missions';
import type { Fields, Language, ParticleState, Theme } from '../lib/types';
import { cross, dot, magnitude, normalize } from '../lib/vector';

const UP_VECTOR = new THREE.Vector3(0, 1, 0);
const RING_NORMAL = new THREE.Vector3(0, 0, 1);

const CAMERA_OFFSET = new THREE.Vector3(4.6, 3.7, 4.8);
const SCENE_PALETTE: Record<
  Theme,
  {
    background: string;
    fog: string;
    gridMajor: string;
    gridMinor: string;
    label: string;
  }
> = {
  dark: {
    background: '#08131f',
    fog: '#08131f',
    gridMajor: '#32516c',
    gridMinor: '#153247',
    label: '#f6fbff',
  },
  light: {
    background: '#eef6fb',
    fog: '#eef6fb',
    gridMajor: '#98bed6',
    gridMinor: '#cddfeb',
    label: '#0e2534',
  },
};

function directionQuaternion(vector: { x: number; y: number; z: number }) {
  const direction = normalize(vector);
  if (direction.x === 0 && direction.y === 0 && direction.z === 0) {
    return new THREE.Quaternion();
  }

  return new THREE.Quaternion().setFromUnitVectors(
    UP_VECTOR,
    new THREE.Vector3(direction.x, direction.y, direction.z),
  );
}

type SimulationSceneProps = {
  language: Language;
  fields: Fields;
  particles: ParticleState[];
  activeParticleId: string;
  cameraFollow: boolean;
  cameraResetToken: number;
  theme: Theme;
  target?: MissionTarget;
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
  const quaternion = useMemo(() => directionQuaternion(vector), [vector.x, vector.y, vector.z]);

  if (length < 0.02) {
    return null;
  }

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
  const coordinates = useMemo(
    () =>
      Array.from({ length: density }, (_, index) =>
        density === 1
          ? 0
          : -span + (index * (span * 2)) / Math.max(density - 1, 1),
      ),
    [density],
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
  const { points, colors } = useMemo(() => {
    const highlight = new THREE.Color('#ffffff');
    const base = new THREE.Color(color);

    return {
      points: trail.map((point) => [point.x, point.y, point.z] as [number, number, number]),
      colors: trail.map((_, index) => {
        const tint = index / Math.max(trail.length - 1, 1);
        return base.clone().lerp(highlight, 1 - tint).toArray() as [number, number, number];
      }),
    };
  }, [trail, color]);

  if (trail.length < 2) {
    return null;
  }

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
  const targetRef = useRef(new THREE.Vector3());
  const desiredRef = useRef(new THREE.Vector3());

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

    targetRef.current.set(
      activeParticle.position.x,
      activeParticle.position.y,
      activeParticle.position.z,
    );
    desiredRef.current.copy(targetRef.current).add(CAMERA_OFFSET);
    camera.position.lerp(desiredRef.current, 0.05);
    controlsRef.current?.target.lerp(targetRef.current, 0.08);
    controlsRef.current?.update();
  });

  return <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.08} />;
}

function CyclotronGuide({
  particle,
  electric,
  magnetic,
}: {
  particle: ParticleState | undefined;
  electric: Fields['electric'];
  magnetic: Fields['magnetic'];
}) {
  const quaternion = useMemo(
    () => directionQuaternion(magnetic),
    [magnetic.x, magnetic.y, magnetic.z],
  );

  if (!particle?.cyclotronRadius || magnitude(magnetic) < 1e-4) {
    return null;
  }

  // Gyrate in the frame moving with the E × B drift: v' = v - E × B / B².
  const b2 = dot(magnetic, magnetic);
  const drift = cross(electric, magnetic);
  const relative = {
    x: particle.velocity.x - drift.x / b2,
    y: particle.velocity.y - drift.y / b2,
    z: particle.velocity.z - drift.z / b2,
  };
  const offset = cross(relative, magnetic);
  const radius = (particle.mass * magnitude(offset)) / (Math.abs(particle.charge) * b2);
  if (radius < 0.05) {
    return null;
  }

  // Guiding centre: x + m (v' × B) / (q B²).
  const factor = particle.mass / (particle.charge * b2);

  return (
    <group
      position={[
        particle.position.x + offset.x * factor,
        particle.position.y + offset.y * factor,
        particle.position.z + offset.z * factor,
      ]}
      quaternion={quaternion}
    >
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.02, 8, 72]} />
        <meshStandardMaterial color={SCENE_COLORS.magnetic} opacity={0.55} transparent />
      </mesh>
    </group>
  );
}

function MissionTargetMarker({ target }: { target: MissionTarget }) {
  const groupRef = useRef<THREE.Group>(null);
  const normal = target.normal ?? RING_NORMAL;
  const quaternion = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        RING_NORMAL,
        new THREE.Vector3(normal.x, normal.y, normal.z).normalize(),
      ),
    [normal.x, normal.y, normal.z],
  );

  useFrame(({ clock }) => {
    groupRef.current?.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3) * 0.08);
  });

  return (
    <group
      position={[target.position.x, target.position.y, target.position.z]}
      quaternion={quaternion}
      ref={groupRef}
    >
      {target.kind === 'orb' && (
        <mesh>
          <sphereGeometry args={[target.radius, 32, 32]} />
          <meshStandardMaterial
            color={SCENE_COLORS.target}
            depthWrite={false}
            emissive={SCENE_COLORS.target}
            emissiveIntensity={0.7}
            opacity={0.3}
            transparent
          />
        </mesh>
      )}
      <mesh>
        <torusGeometry args={[target.kind === 'orb' ? target.radius + 0.12 : target.radius, 0.05, 12, 64]} />
        <meshStandardMaterial
          color={SCENE_COLORS.target}
          emissive={SCENE_COLORS.target}
          emissiveIntensity={0.9}
        />
      </mesh>
    </group>
  );
}

function AxisLabels({ color }: { color: string }) {
  return (
    <>
      {(
        [
          ['x', [3.35, 0, 0], '#ff7a6b'],
          ['y', [0, 3.35, 0], '#7be07b'],
          ['z', [0, 0, 3.35], '#6fa8ff'],
        ] as const
      ).map(([label, position, tint]) => (
        <Text
          anchorX="center"
          anchorY="middle"
          color={tint}
          fontSize={0.36}
          key={label}
          outlineColor={color}
          outlineWidth={0.01}
          position={position as unknown as [number, number, number]}
        >
          {label}
        </Text>
      ))}
    </>
  );
}

function SceneContent({
  language,
  fields,
  particles,
  activeParticleId,
  cameraFollow,
  cameraResetToken,
  theme,
  target,
}: SimulationSceneProps) {
  const activeParticle = particles.find((particle) => particle.id === activeParticleId);
  const fieldScale = fields.scaleMode === 'teaching' ? 0.4 : 0.24;
  const palette = SCENE_PALETTE[theme];

  return (
    <>
      <color attach="background" args={[palette.background]} />
      <fog attach="fog" args={[palette.fog, 12, 24]} />
      <ambientLight intensity={0.8} />
      <directionalLight color="#fff5d6" intensity={1.4} position={[7, 8, 6]} />
      <pointLight color="#8ce6ff" intensity={1.2} position={[-6, 5, -5]} />
      <gridHelper args={[20, 20, palette.gridMajor, palette.gridMinor]} position={[0, -4.6, 0]} />
      <axesHelper args={[3]} />
      {/* Text labels fetch fonts at runtime; keep the rest of the scene visible if that is slow or blocked. */}
      <Suspense fallback={null}>
        <AxisLabels color={palette.background} />
      </Suspense>
      {target && <MissionTargetMarker target={target} />}
      <FieldArrows
        color={SCENE_COLORS.electric}
        density={fields.density}
        scaleFactor={fieldScale}
        vector={fields.electric}
      />
      <FieldArrows
        color={SCENE_COLORS.magnetic}
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
            <meshStandardMaterial color={particle.color} emissive={particle.color} emissiveIntensity={0.45} />
          </mesh>
          <mesh
            position={[
              particle.position.x,
              particle.position.y,
              particle.position.z,
            ]}
          >
            <sphereGeometry
              args={[particle.id === activeParticleId ? 0.46 : 0.34, 20, 20]}
            />
            <meshBasicMaterial
              color={particle.color}
              depthWrite={false}
              opacity={0.16}
              transparent
            />
          </mesh>
          <Suspense fallback={null}>
            <Text
              anchorX="center"
              anchorY="bottom"
              color={palette.label}
              fontSize={0.32}
              position={[
                particle.position.x,
                particle.position.y + 0.42,
                particle.position.z,
              ]}
            >
              {particleLabel(particle, language)}
            </Text>
          </Suspense>
        </group>
      ))}

      {activeParticle && (
        <>
          <ArrowGlyph
            color={SCENE_COLORS.velocity}
            origin={[
              activeParticle.position.x,
              activeParticle.position.y,
              activeParticle.position.z,
            ]}
            scaleFactor={0.55}
            vector={activeParticle.velocity}
          />
          <ArrowGlyph
            color={SCENE_COLORS.force}
            origin={[
              activeParticle.position.x,
              activeParticle.position.y,
              activeParticle.position.z,
            ]}
            scaleFactor={0.22}
            vector={activeParticle.force}
          />
          <CyclotronGuide electric={fields.electric} magnetic={fields.magnetic} particle={activeParticle} />
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
