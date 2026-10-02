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
  url: string;
  resumen: string;
}

export interface HeroShowcaseProps {
  projects: ShowcaseProject[];
}

const ROTATION_MS = 4500;
// Every card moves for the same duration on each shuffle so the whole deck
// reads as one gesture.
const FLIGHT_DURATION_S = 0.55;
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

// Brand red flashed during the shuffle, toned down from the solid brand red.
const FLIGHT_RED = '#d3311d';
const LINE = '#e3dfd6';

// Soft, warm shadows (ink-tinted, never pure black), scaled down with depth.
const SHADOW_FRONT =
  '0 1px 2px rgb(36 33 29 / 0.06), 0 18px 40px -12px rgb(36 33 29 / 0.18)';
const SHADOW_MIDDLE =
  '0 1px 2px rgb(36 33 29 / 0.05), 0 12px 28px -10px rgb(36 33 29 / 0.14)';
const SHADOW_BACK =
  '0 1px 1px rgb(36 33 29 / 0.04), 0 8px 18px -8px rgb(36 33 29 / 0.1)';

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

// Straight deck: depth reads from vertical offset, scale and opacity only —
// no fanned rotation at rest.
const SLOTS: Record<Exclude<StackPosition, 'hidden'>, StackSlot> = {
  front: { x: 0, y: 0, scale: 1, opacity: 1, rotateZ: 0, boxShadow: SHADOW_FRONT },
  middle: {
    x: 0,
    y: 18,
    scale: 0.955,
    opacity: 0.9,
    rotateZ: 0,
    boxShadow: SHADOW_MIDDLE,
  },
  back: {
    x: 0,
    y: 34,
    scale: 0.91,
    opacity: 0.78,
    rotateZ: 0,
    boxShadow: SHADOW_BACK,
  },
};

// A thin red sliver peeking out from under the back of the deck — a brand
// touch, not a full card.
const RED_SLOT = { y: 44, height: 14 };

// Waiting cards sit fully behind the deck, invisible until their turn.
const HIDDEN_SLOT: StackSlot = {
  x: 0,
  y: 40,
  scale: 0.9,
  opacity: 0,
  rotateZ: 0,
  boxShadow: SHADOW_BACK,
};

// Pointer-tilt strength per depth: the front card reacts the most, cards
// further back barely move — this is whole-card 3D tilt, not an inner
// parallax of the screenshot.
const TILT_STRENGTH: Record<StackPosition, number> = {
  front: 1,
  middle: 0.55,
  back: 0.3,
  hidden: 0,
};
const MAX_TILT_DEG = 4;
const MAX_TILT_PX = 6;

interface RedSliverProps {
  front: number;
  reducedMotion: boolean;
}

// A plain red sliver living under the deck: a thin strip, not a full card,
// with a small sympathetic dip on every shuffle so it reads as part of the
// stack without competing with it.
function RedSliver({ front, reducedMotion }: RedSliverProps) {
  const controls = useAnimationControls();
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (reducedMotion) return;
    controls.start({
      y: [RED_SLOT.y, RED_SLOT.y + 10, RED_SLOT.y],
      transition: {
        duration: RISE_DURATION_S,
        ease: 'easeInOut',
        times: [0, 0.45, 1],
      },
    });
  }, [front, reducedMotion, controls]);

  return (
    <motion.div
      className="bg-red absolute inset-x-3 rounded-b-[12px]"
      style={{
        height: RED_SLOT.height,
        boxShadow: '0 0.6rem 1.4rem rgb(211 49 29 / 0.14)',
      }}
      initial={{ y: RED_SLOT.y }}
      animate={controls}
      aria-hidden="true"
    />
  );
}

interface TiltMotion {
  x: MotionValue<number>;
  y: MotionValue<number>;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
}

interface ShowcaseCardProps {
  project: ShowcaseProject;
  position: StackPosition;
  tilt: TiltMotion;
}

function ShowcaseCard({ project, position, tilt }: ShowcaseCardProps) {
  const previousPosition = useRef(position);
  const [flightZ, setFlightZ] = useState<number | null>(null);

  // True for the whole flight: the ref is only advanced once the card has
  // settled, so re-renders mid-flight keep the same keyframe target.
  const inFlight =
    previousPosition.current === 'front' &&
    (position === 'back' || position === 'hidden');
  const promoted =
    previousPosition.current === 'middle' && position === 'front';
  const stepped = previousPosition.current === 'back' && position === 'middle';

  useEffect(() => {
    if (!(
      previousPosition.current === 'front' &&
      (position === 'back' || position === 'hidden')
    )) {
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
  const strength = TILT_STRENGTH[position];
  const tiltX = useTransform(tilt.x, (value) => value * strength);
  const tiltY = useTransform(tilt.y, (value) => value * strength);
  const tiltRotateX = useTransform(tilt.rotateX, (value) => value * strength);
  const tiltRotateY = useTransform(tilt.rotateY, (value) => value * strength);

  // Deal-a-card path: lift in a wide continuous arc, slide behind the deck
  // while descending, then land in the back slot — with just enough tilt to
  // read as a gesture, settling flat. The card promoted to the front mirrors
  // it: it slips out below and rises into place while the leaving card is
  // still mid-air.
  const target: TargetAndTransition = inFlight
    ? {
        ...slot,
        x: [null, 70, 30, slot.x],
        y: [null, -200, -90, slot.y],
        rotateZ: [null, 4, 1.5, slot.rotateZ],
        scale: [null, 0.88, 0.85, slot.scale],
        // Fully visible for the whole arc; if it lands on the hidden slot it
        // only fades once it is already tucked behind the deck.
        opacity: [null, 1, 1, slot.opacity],
        borderColor: [null, FLIGHT_RED, FLIGHT_RED, LINE],
        boxShadow: [
          null,
          '0 1px 2px rgb(36 33 29 / 0.08), 0 1.4rem 3rem rgb(211 49 29 / 0.2)',
          '0 1px 2px rgb(36 33 29 / 0.07), 0 1rem 2.2rem rgb(211 49 29 / 0.12)',
          slot.boxShadow,
        ],
      }
    : promoted
      ? {
          ...slot,
          x: [null, -34, -14, slot.x],
          y: [null, 56, 22, slot.y],
          rotateZ: [null, -3, -1, slot.rotateZ],
          scale: [null, 0.95, 0.985, slot.scale],
          borderColor: [null, FLIGHT_RED, LINE],
        }
      : stepped
        ? {
            ...slot,
            x: [null, -22, -9, slot.x],
            y: [null, 74, 40, slot.y],
            rotateZ: [null, -3, -1, slot.rotateZ],
            scale: [null, 0.915, 0.93, slot.scale],
          }
        : { ...slot };

  const seg = (duration: number, times: number[], ease: Easing[]) => ({
    duration,
    times,
    ease,
  });

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        x: tiltX,
        y: tiltY,
        rotateX: tiltRotateX,
        rotateY: tiltRotateY,
        transformPerspective: 1200,
        zIndex: flightZ ?? (inFlight ? LIFT_Z : SLOT_Z[position]),
      }}
    >
      <motion.article
        className="border-line bg-surface absolute inset-0 flex flex-col overflow-hidden rounded-[12px] border"
        style={{ transformOrigin: '50% 50%' }}
        initial={false}
        animate={target}
        transition={
          inFlight
            ? {
                default: { duration: FLIGHT_DURATION_S, ease: EASE },
                x: seg(
                  FLIGHT_DURATION_S,
                  [0, 0.52, 0.78, 1],
                  ['easeOut', 'easeInOut', 'easeOut'],
                ),
                y: seg(
                  FLIGHT_DURATION_S,
                  [0, 0.42, 0.72, 1],
                  ['easeOut', 'easeIn', 'easeOut'],
                ),
                rotateZ: seg(
                  FLIGHT_DURATION_S,
                  [0, 0.48, 0.76, 1],
                  ['easeOut', 'easeInOut', 'easeOut'],
                ),
                scale: seg(
                  FLIGHT_DURATION_S,
                  [0, 0.48, 0.76, 1],
                  ['easeOut', 'easeInOut', 'easeOut'],
                ),
              }
            : promoted || stepped
              ? {
                  default: { duration: RISE_DURATION_S, ease: EASE },
                  x: seg(
                    RISE_DURATION_S,
                    [0, 0.48, 0.76, 1],
                    ['easeOut', 'easeInOut', 'easeOut'],
                  ),
                  y: seg(
                    RISE_DURATION_S,
                    [0, 0.4, 0.72, 1],
                    ['easeOut', 'easeInOut', 'easeOut'],
                  ),
                  rotateZ: seg(
                    RISE_DURATION_S,
                    [0, 0.44, 0.74, 1],
                    ['easeOut', 'easeInOut', 'easeOut'],
                  ),
                  scale: seg(
                    RISE_DURATION_S,
                    [0, 0.44, 0.74, 1],
                    ['easeOut', 'easeInOut', 'easeOut'],
                  ),
                }
              : { default: { duration: SWAP_DURATION_S, ease: EASE } }
        }
      >
        <div className="border-line flex h-10 shrink-0 items-center justify-between gap-3 border-b px-4">
          <span className="font-display truncate text-sm font-semibold">
            {project.name}
          </span>
          <span className="text-muted shrink-0 text-xs">
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
      </motion.article>
    </motion.div>
  );
}

export default function HeroShowcase({ projects }: HeroShowcaseProps) {
  const reducedMotion = useReducedMotion();
  const deck = projects;
  const [front, setFront] = useState(0);
  const [paused, setPaused] = useState(false);
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    setFinePointer(window.matchMedia('(pointer: fine)').matches);
  }, []);

  const pointerActive = finePointer && !reducedMotion;

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springConfig = { stiffness: 150, damping: 20 };
  // Whole-card tilt: translate a few px and rotate a few degrees in 3D. The
  // content inside each card never gets its own transform, so it never
  // moves relative to the card.
  const tiltX = useSpring(
    useTransform(rawX, (value) => value * MAX_TILT_PX),
    springConfig,
  );
  const tiltY = useSpring(
    useTransform(rawY, (value) => value * MAX_TILT_PX * 0.6),
    springConfig,
  );
  const tiltRotateY = useSpring(
    useTransform(rawX, (value) => value * MAX_TILT_DEG),
    springConfig,
  );
  const tiltRotateX = useSpring(
    useTransform(rawY, (value) => value * -MAX_TILT_DEG),
    springConfig,
  );

  useEffect(() => {
    if (reducedMotion || deck.length < 2 || paused) return;
    const id = window.setInterval(
      () => setFront((current) => (current + 1) % deck.length),
      ROTATION_MS,
    );
    return () => window.clearInterval(id);
  }, [reducedMotion, deck.length, paused]);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerActive) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    rawX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    rawY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  const resetTilt = () => {
    rawX.set(0);
    rawY.set(0);
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setPaused(false);
    }
  };

  if (deck.length === 0) return null;

  const current = deck[front];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        resetTilt();
      }}
      onFocus={() => setPaused(true)}
      onBlur={handleBlur}
    >
      <div
        className="relative w-full"
        style={{ aspectRatio: '16 / 10' }}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
      >
        <RedSliver front={front} reducedMotion={reducedMotion ?? false} />
        {deck.map((project, index) => (
          <ShowcaseCard
            key={project.id}
            project={project}
            position={positionFor((index - front + deck.length) % deck.length)}
            tilt={{
              x: tiltX,
              y: tiltY,
              rotateX: tiltRotateX,
              rotateY: tiltRotateY,
            }}
          />
        ))}
      </div>

      {current && (
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p
              aria-live="polite"
              className="font-display truncate text-base font-semibold"
            >
              {current.name}
            </p>
            <p className="text-muted truncate text-sm">{current.resumen}</p>
            <a
              href={current.url}
              className="mt-1 inline-block text-sm font-semibold underline underline-offset-4"
            >
              Abrir
            </a>
          </div>
          <div
            className="flex shrink-0 items-center gap-1.5 pt-1"
            role="group"
            aria-label="Elegir proyecto"
          >
            {deck.map((project, index) => (
              <button
                key={project.id}
                type="button"
                aria-label={`Mostrar ${project.name}`}
                aria-current={index === front}
                onClick={() => setFront(index)}
                className={`h-[3px] w-6 rounded-full transition-colors ${
                  index === front ? 'bg-ink' : 'bg-line'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
