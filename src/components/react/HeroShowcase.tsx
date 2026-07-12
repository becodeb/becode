import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Easing,
  type MotionValue,
  type TargetAndTransition,
} from 'framer-motion';

export interface ShowcaseProject {
  id: string;
  name: string;
  category: string;
  screenshot: string;
}

export interface HeroShowcaseProps {
  projects: ShowcaseProject[];
}

const ROTATION_MS = 4500;
// Every card moves for the same duration on each shuffle so the whole deck
// reads as one gesture.
const FLIGHT_DURATION_S = .55;
const SWAP_DURATION_S = FLIGHT_DURATION_S;
const RISE_DURATION_S = FLIGHT_DURATION_S;
const EASE = [0.22, 1, 0.36, 1] as const;

// z choreography for the card leaving the front: it lifts above everything,
// and switches behind the deck near the top of its arc — where it barely
// overlaps the other cards — so it reads as passing behind, not through.
// The layer switches are snaps, never tweens.
const LIFT_Z = 40;
const TUCK_Z = 2;
const TUCK_MS = 0.48 * FLIGHT_DURATION_S * 1000;
const SETTLE_MS = FLIGHT_DURATION_S * 1000;

// Brand accents flashed during the shuffle (theme --color-signal / --color-line).
const SIGNAL = '#d3311d';
const LINE = '#e1ddd4';

type StackPosition = 'front' | 'middle' | 'back' | 'hidden';

// Cards beyond the three visible ones wait out of sight behind the deck.
const positionFor = (offset: number): StackPosition =>
  offset === 0
    ? 'front'
    : offset === 1
      ? 'middle'
      : offset === 2
        ? 'back'
        : 'hidden';

const SLOT_Z: Record<StackPosition, number> = {
  front: 30,
  middle: 20,
  back: 10,
  hidden: 4,
};

interface StackSlot {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  rotateZ: number;
  boxShadow: string;
}

// Stepped deck: each card sits a bit lower than the one in front, all
// fanned to the same side, the front one slightly tilted too.
const SLOTS: Record<Exclude<StackPosition, 'hidden'>, StackSlot> = {
  front: {
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    rotateZ: 1.5,
    boxShadow: '0 2rem 5rem rgb(67 48 28 / 0.2)',
  },
  middle: {
    x: 0,
    y: 32,
    scale: 0.94,
    opacity: 0.88,
    rotateZ: 2.8,
    boxShadow: '0 1.1rem 2.6rem rgb(67 48 28 / 0.12)',
  },
  back: {
    x: 0,
    y: 60,
    scale: 0.885,
    opacity: 0.75,
    rotateZ: 5,
    boxShadow: '0 0.5rem 1.4rem rgb(67 48 28 / 0.07)',
  },
};

// The all-red card slotted between middle and back, fanned the same way.
const RED_SLOT = { x: 0, y: 47, scale: 0.912, rotate: 4, z: 15 };

// Waiting cards sit fully behind the deck, invisible until their turn.
const HIDDEN_SLOT: StackSlot = {
  x: 0,
  y: 66,
  scale: 0.87,
  opacity: 0,
  rotateZ: 5,
  boxShadow: '0 0.5rem 1.4rem rgb(67 48 28 / 0.07)',
};

const PARALLAX_STRENGTH: Record<StackPosition, number> = {
  front: 16,
  middle: 10,
  back: 5,
  hidden: 5,
};

interface RedCardProps {
  front: number;
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
  reducedMotion: boolean;
}

// A plain red card living inside the deck: same size and radius as the
// others, its own tilt and parallax layer, and a sympathetic dip on every
// shuffle so it moves with the rest of the stack.
function RedCard({ front, parallaxX, parallaxY, reducedMotion }: RedCardProps) {
  const controls = useAnimationControls();
  const mounted = useRef(false);
  const x = useTransform(parallaxX, (value) => value * 7);
  const y = useTransform(parallaxY, (value) => value * 7 * 0.6);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (reducedMotion) return;
    controls.start({
      y: [RED_SLOT.y, RED_SLOT.y + 36, RED_SLOT.y],
      rotate: [RED_SLOT.rotate, RED_SLOT.rotate - 2.5, RED_SLOT.rotate],
      transition: {
        duration: RISE_DURATION_S,
        ease: 'easeInOut',
        times: [0, 0.45, 1],
      },
    });
  }, [front, reducedMotion, controls]);

  return (
    <div
      className="absolute inset-0"
      style={{ zIndex: RED_SLOT.z }}
      aria-hidden="true"
    >
      <motion.div className="h-full w-full" style={{ x, y }}>
        <motion.div
          className="bg-signal h-full w-full rounded-[var(--radius-ui)]"
          style={{
            transformOrigin: '50% 50%',
            boxShadow: '0 0.9rem 2.2rem rgb(211 49 29 / 0.16)',
          }}
          initial={{
            x: RED_SLOT.x,
            y: RED_SLOT.y,
            rotate: RED_SLOT.rotate,
            scale: RED_SLOT.scale,
          }}
          animate={controls}
        />
      </motion.div>
    </div>
  );
}

interface ShowcaseCardProps {
  project: ShowcaseProject;
  position: StackPosition;
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
}

function ShowcaseCard({
  project,
  position,
  parallaxX,
  parallaxY,
}: ShowcaseCardProps) {
  const previousPosition = useRef(position);
  const [flightZ, setFlightZ] = useState<number | null>(null);

  // True for the whole flight: the ref is only advanced once the card has
  // settled, so re-renders mid-flight keep the same keyframe target.
  const inFlight =
    previousPosition.current === 'front' &&
    (position === 'back' || position === 'hidden');
  const promoted =
    previousPosition.current === 'middle' && position === 'front';
  const stepped =
    previousPosition.current === 'back' && position === 'middle';

  useEffect(() => {
    if (
      !(
        previousPosition.current === 'front' &&
        (position === 'back' || position === 'hidden')
      )
    ) {
      previousPosition.current = position;
      return;
    }
    setFlightZ(LIFT_Z);
    const tuck = window.setTimeout(() => setFlightZ(TUCK_Z), TUCK_MS);
    const settle = window.setTimeout(() => {
      previousPosition.current = position;
      setFlightZ(null);
    }, SETTLE_MS);
    return () => {
      window.clearTimeout(tuck);
      window.clearTimeout(settle);
    };
  }, [position]);

  const slot = position === 'hidden' ? HIDDEN_SLOT : SLOTS[position];
  const strength = PARALLAX_STRENGTH[position];
  const x = useTransform(parallaxX, (value) => value * strength);
  const y = useTransform(parallaxY, (value) => value * strength * 0.6);

  // Deal-a-card path: lift and tilt up-to-the-right in a wide continuous
  // arc, slide behind the red block while descending, then land in the back
  // slot. x and y peak at different moments so the card never sits still.
  // The card promoted to the front mirrors it: it slips out below-left and
  // rises into place while the leaving card is still mid-air.
  const target: TargetAndTransition = inFlight
    ? {
        ...slot,
        x: [null, 110, 50, slot.x],
        y: [null, -220, -95, slot.y],
        rotateZ: [null, 9, 3.5, slot.rotateZ],
        scale: [null, 0.88, 0.85, slot.scale],
        // Fully visible for the whole arc; if it lands on the hidden slot it
        // only fades once it is already tucked behind the deck.
        opacity: [null, 1, 1, slot.opacity],
        borderColor: [null, SIGNAL, SIGNAL, LINE],
        boxShadow: [
          null,
          '0 1.8rem 4.2rem rgb(211 49 29 / 0.3)',
          '0 1rem 2.6rem rgb(211 49 29 / 0.18)',
          slot.boxShadow,
        ],
      }
    : promoted
      ? {
          ...slot,
          x: [null, -52, -20, slot.x],
          y: [null, 62, 24, slot.y],
          rotateZ: [null, -6, -2.5, slot.rotateZ],
          scale: [null, 0.95, 0.985, slot.scale],
          borderColor: [null, SIGNAL, LINE],
        }
      : stepped
        ? {
            ...slot,
            x: [null, -34, -14, slot.x],
            y: [null, 82, 44, slot.y],
            rotateZ: [null, -6, -2.5, slot.rotateZ],
            scale: [null, 0.915, 0.93, slot.scale],
          }
        : { ...slot };

  const seg = (duration: number, times: number[], ease: Easing[]) => ({
    duration,
    times,
    ease,
  });

  return (
    <motion.article
      className="border-line bg-surface absolute inset-0 overflow-hidden rounded-[var(--radius-ui)] border"
      style={{
        zIndex: flightZ ?? (inFlight ? LIFT_Z : SLOT_Z[position]),
        transformOrigin: '50% 50%',
      }}
      initial={false}
      animate={target}
      transition={
        inFlight
          ? {
              default: { duration: FLIGHT_DURATION_S, ease: EASE },
              x: seg(FLIGHT_DURATION_S, [0, 0.52, 0.78, 1], ['easeOut', 'easeInOut', 'easeOut']),
              y: seg(FLIGHT_DURATION_S, [0, 0.42, 0.72, 1], ['easeOut', 'easeIn', 'easeOut']),
              rotateZ: seg(FLIGHT_DURATION_S, [0, 0.48, 0.76, 1], ['easeOut', 'easeInOut', 'easeOut']),
              scale: seg(FLIGHT_DURATION_S, [0, 0.48, 0.76, 1], ['easeOut', 'easeInOut', 'easeOut']),
            }
          : promoted || stepped
            ? {
                default: { duration: RISE_DURATION_S, ease: EASE },
                x: seg(RISE_DURATION_S, [0, 0.48, 0.76, 1], ['easeOut', 'easeInOut', 'easeOut']),
                y: seg(RISE_DURATION_S, [0, 0.4, 0.72, 1], ['easeOut', 'easeInOut', 'easeOut']),
                rotateZ: seg(RISE_DURATION_S, [0, 0.44, 0.74, 1], ['easeOut', 'easeInOut', 'easeOut']),
                scale: seg(RISE_DURATION_S, [0, 0.44, 0.74, 1], ['easeOut', 'easeInOut', 'easeOut']),
              }
            : { default: { duration: SWAP_DURATION_S, ease: EASE } }
      }
    >
      <motion.div className="flex h-full w-full flex-col" style={{ x, y }}>
        <div className="border-line flex h-11 shrink-0 items-center gap-3 border-b px-4 text-xs font-bold">
          <span className="bg-ink text-surface grid h-7 w-7 place-items-center rounded-[0.2rem]">
            b<span className="text-signal">/</span>
          </span>
          <span className="truncate">{project.name}</span>
          <span className="text-muted ml-auto shrink-0 font-mono text-[0.62rem] uppercase">
            {project.category}
          </span>
        </div>
        <img
          src={project.screenshot}
          alt={`Vista previa de ${project.name}`}
          width={1280}
          height={800}
          loading="eager"
          decoding="async"
          className="min-h-0 w-full flex-1 object-cover object-top"
        />
      </motion.div>
    </motion.article>
  );
}

export default function HeroShowcase({ projects }: HeroShowcaseProps) {
  const reducedMotion = useReducedMotion();
  const deck = projects;
  const [front, setFront] = useState(0);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const parallaxX = useSpring(pointerX, {
    stiffness: 120,
    damping: 20,
    mass: 0.4,
  });
  const parallaxY = useSpring(pointerY, {
    stiffness: 120,
    damping: 20,
    mass: 0.4,
  });

  useEffect(() => {
    if (reducedMotion || deck.length < 2) return;
    const id = window.setInterval(
      () => setFront((current) => (current + 1) % deck.length),
      ROTATION_MS,
    );
    return () => window.clearInterval(id);
  }, [reducedMotion, deck.length]);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  if (deck.length === 0) return null;

  return (
    <div
      className="relative aspect-[16/10] w-full"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <RedCard
        front={front}
        parallaxX={parallaxX}
        parallaxY={parallaxY}
        reducedMotion={reducedMotion ?? false}
      />
      {deck.map((project, index) => (
        <ShowcaseCard
          key={project.id}
          project={project}
          position={positionFor((index - front + deck.length) % deck.length)}
          parallaxX={parallaxX}
          parallaxY={parallaxY}
        />
      ))}
    </div>
  );
}
