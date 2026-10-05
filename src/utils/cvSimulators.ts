// Computer Vision Dashboard Simulators (Holographic Cyber-Vision Style)

// Helper to draw a glowing grid background
const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, spacing = 30) => {
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
};

// Helper to draw a computer vision corner overlay on bounding boxes
export const drawCVCornerBox = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  lineWidth = 2,
  cornerLen = 12
) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  
  // Top Left
  ctx.beginPath();
  ctx.moveTo(x + cornerLen, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + cornerLen);
  ctx.stroke();

  // Top Right
  ctx.beginPath();
  ctx.moveTo(x + w - cornerLen, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + cornerLen);
  ctx.stroke();

  // Bottom Left
  ctx.beginPath();
  ctx.moveTo(x, y + h - cornerLen);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + cornerLen, y + h);
  ctx.stroke();

  // Bottom Right
  ctx.beginPath();
  ctx.moveTo(x + w - cornerLen, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + h - cornerLen);
  ctx.stroke();

  // Subtle filled background
  ctx.fillStyle = color.replace('1)', '0.04').replace('rgb', 'rgba');
  ctx.fillRect(x, y, w, h);
};

// Helper for UI/Text overlay
export const drawTextBadge = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  bgColor: string,
  textColor = '#000000',
  fontSize = 11
) => {
  ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
  const textWidth = ctx.measureText(text).width;
  const paddingH = 6;
  const paddingV = 4;
  
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y - fontSize, textWidth + paddingH * 2, fontSize + paddingV * 2);
  
  ctx.fillStyle = textColor;
  ctx.fillText(text, x + paddingH, y + paddingV);
};

// ==========================================
// 1. ACCIDENT DETECTION SIMULATOR
// ==========================================
export interface AccidentSimState {
  cars: {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    w: number;
    h: number;
    color: string;
    label: string;
  }[];
  collisionFrame: number; // Frame index of collision
  isCrashDetected: boolean;
  crashPoint: { x: number; y: number } | null;
  crashImpactRadius: number;
}

export const initAccidentSim = (width: number, height: number): AccidentSimState => {
  return {
    cars: [
      { id: 1, x: 50, y: height / 2 - 20, vx: 3.5, vy: 0, w: 50, h: 28, color: '#38bdf8', label: 'VEHICLE_A (ID: 102)' },
      { id: 2, x: width - 110, y: height / 2 - 10, vx: -2.8, vy: -0.5, w: 50, h: 28, color: '#a855f7', label: 'VEHICLE_B (ID: 407)' }
    ],
    collisionFrame: -1,
    isCrashDetected: false,
    crashPoint: null,
    crashImpactRadius: 0
  };
};

export const drawAccidentSim = (
  canvas: HTMLCanvasElement,
  frame: number,
  state: AccidentSimState,
  sensitivity: number, // 0 to 100
  onAlert: (msg: string) => void
): AccidentSimState => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return state;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  
  drawGrid(ctx, w, h);

  // Draw simulated double-lane intersection road
  ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
  ctx.fillRect(0, h / 2 - 60, w, 120);
  
  // Road markings
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.setLineDash([15, 15]);
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();
  ctx.setLineDash([]); // Reset
  
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, h / 2 - 60);
  ctx.lineTo(w, h / 2 - 60);
  ctx.moveTo(0, h / 2 + 60);
  ctx.lineTo(w, h / 2 + 60);
  ctx.stroke();

  let nextState = { ...state };
  
  // Collision physics animation cycle (loop every 280 frames)
  const cycleFrame = frame % 280;
  
  if (cycleFrame === 0) {
    // Reset simulation
    nextState = initAccidentSim(w, h);
  }

  // Physics update before crash
  const carA = nextState.cars[0];
  const carB = nextState.cars[1];

  const dist = Math.hypot((carA.x + carA.w/2) - (carB.x + carB.w/2), (carA.y + carA.h/2) - (carB.y + carB.h/2));

  // Determine if a crash should occur
  const isCrashing = dist < 45;

  if (isCrashing && !nextState.isCrashDetected) {
    nextState.isCrashDetected = true;
    nextState.collisionFrame = cycleFrame;
    nextState.crashPoint = {
      x: (carA.x + carA.w/2 + carB.x + carB.w/2) / 2,
      y: (carA.y + carA.h/2 + carB.y + carB.h/2) / 2
    };
    // Trigger callback alert
    if (sensitivity > 20) {
      onAlert('COLLISION DETECTED: Veh-102 and Veh-407 collided at Intersection C');
    }
  }

  // Update position
  nextState.cars = nextState.cars.map(car => {
    if (nextState.isCrashDetected) {
      // Post-crash slowing/bounce physics
      const crashAge = cycleFrame - nextState.collisionFrame;
      if (crashAge < 30) {
        return {
          ...car,
          x: car.x + car.vx * (1 - crashAge / 30) * -0.2, // slow recoil
          y: car.y + car.vy * (1 - crashAge / 30) * -0.2
        };
      }
      return car; // stopped
    } else {
      return {
        ...car,
        x: car.x + car.vx,
        y: car.y + car.vy
      };
    }
  });

  // Render Vehicles with AI Bounding Boxes
  nextState.cars.forEach(car => {
    const boxColor = nextState.isCrashDetected ? 'rgba(244, 63, 94, 1)' : 'rgba(56, 189, 248, 1)';
    
    // Draw wireframe holographic vehicle body
    ctx.strokeStyle = car.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(car.x, car.y, car.w, car.h);
    
    // Draw CV AI bounding box around it
    drawCVCornerBox(ctx, car.x - 4, car.y - 4, car.w + 8, car.h + 8, boxColor);
    
    // Draw headlights
    ctx.fillStyle = '#fef08a';
    if (car.vx > 0) {
      ctx.fillRect(car.x + car.w, car.y + 4, 3, 4);
      ctx.fillRect(car.x + car.w, car.y + car.h - 8, 3, 4);
    } else {
      ctx.fillRect(car.x - 3, car.y + 4, 3, 4);
      ctx.fillRect(car.x - 3, car.y + car.h - 8, 3, 4);
    }

    // Velocity vector lines
    if (!nextState.isCrashDetected) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(car.x + car.w/2, car.y + car.h/2);
      ctx.lineTo(car.x + car.w/2 + car.vx * 10, car.y + car.h/2 + car.vy * 10);
      ctx.stroke();
      
      // Vector arrow head
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(car.x + car.w/2 + car.vx * 10, car.y + car.h/2 + car.vy * 10, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // AI tags
    const speed = nextState.isCrashDetected ? '0 km/h (CRASH)' : `${Math.abs(Math.round(car.vx * 20))} km/h`;
    drawTextBadge(ctx, `${car.label} | ${speed}`, car.x - 4, car.y - 10, nextState.isCrashDetected ? '#f43f5e' : '#1e293b', '#fff');
  });

  // Render Crash Visual Telemetry
  if (nextState.isCrashDetected && nextState.crashPoint) {
    const cp = nextState.crashPoint;
    const crashAge = cycleFrame - nextState.collisionFrame;
    
    nextState.crashImpactRadius = (crashAge * 3) % 70;
    
    // Impact rings
    ctx.strokeStyle = `rgba(244, 63, 94, ${Math.max(0, 1 - crashAge/60)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cp.x, cp.y, nextState.crashImpactRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(cp.x, cp.y, Math.max(0, nextState.crashImpactRadius - 20), 0, Math.PI * 2);
    ctx.stroke();

    // Red warning sign flashing
    if (Math.floor(frame / 10) % 2 === 0) {
      // Draw big flashing Alert Banner
      ctx.fillStyle = 'rgba(244, 63, 94, 0.9)';
      ctx.fillRect(w / 2 - 130, 20, 260, 34);
      
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ ACCIDENT DETECTED: CAM-03', w / 2, 42);
      ctx.textAlign = 'left'; // reset
    }

    // Impact Force metric box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1;
    ctx.fillRect(cp.x - 65, cp.y - 75, 130, 42);
    ctx.strokeRect(cp.x - 65, cp.y - 75, 130, 42);

    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#f43f5e';
    ctx.fillText('CRASH TELEMETRY', cp.x - 58, cp.y - 62);
    ctx.fillStyle = '#fff';
    ctx.fillText(`IMPACT FORCE: 6.8 G`, cp.x - 58, cp.y - 48);
  }

  // Render Indian Highway Milestone on bottom left
  ctx.fillStyle = '#fbbf24'; // Yellow top
  ctx.beginPath();
  ctx.arc(35, h - 40, 11, Math.PI, 0);
  ctx.lineTo(46, h - 25);
  ctx.lineTo(24, h - 25);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff'; // White bottom
  ctx.fillRect(24, h - 25, 22, 15);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(24, h - 25, 22, 15);
  // Stroke top curve
  ctx.beginPath();
  ctx.arc(35, h - 40, 11, Math.PI, 0);
  ctx.lineTo(46, h - 25);
  ctx.moveTo(24, h - 25);
  ctx.arc(35, h - 40, 11, Math.PI, 0);
  ctx.stroke();

  ctx.fillStyle = '#000000';
  ctx.font = '700 7px "JetBrains Mono", monospace';
  ctx.fillText('NH 2', 28, h - 36);
  ctx.font = '600 5px "JetBrains Mono", monospace';
  ctx.fillText('DL 240', 25, h - 18);

  // Camera identifier overlay
  ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
  ctx.fillRect(10, 10, 175, 22);
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('🔴 LIVE: CAM-03 (NH 2 EXP)', 16, 24);

  return nextState;
};

// ==========================================
// 2. DRIVER DROWSINESS DETECTION SIMULATOR (VIRTUAL EYE STATUS & FACE GRAPH)
// ==========================================
export interface DrowsinessSimState {
  ear: number;
  drowsyIndex: number;
  eyesClosed: boolean;
  yawning: boolean;
  eyeTimer: number;
  yawnTimer: number;
  alertsTriggered: number;
}

export const initDrowsinessSim = (): DrowsinessSimState => {
  return {
    ear: 0.32,
    drowsyIndex: 0,
    eyesClosed: false,
    yawning: false,
    eyeTimer: 0,
    yawnTimer: 0,
    alertsTriggered: 0
  };
};

export const drawDrowsinessSim = (
  canvas: HTMLCanvasElement,
  frame: number,
  state: DrowsinessSimState,
  drowsinessThreshold: number, // threshold for buzzer (e.g. 50-80)
  onAlert: (msg: string) => void
): DrowsinessSimState => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return state;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  
  drawGrid(ctx, w, h);

  let nextState = { ...state };
  
  // Drowsiness state machine loop (cycles every 400 frames)
  const cycle = frame % 400;
  
  if (cycle < 160) {
    // Normal blinking
    nextState.eyesClosed = cycle % 70 > 66; // quick blink
    nextState.yawning = false;
    nextState.ear = nextState.eyesClosed ? 0.06 : 0.30 + Math.sin(frame/10) * 0.02;
    nextState.drowsyIndex = Math.max(0, nextState.drowsyIndex - 0.5);
  } else if (cycle >= 160 && cycle < 280) {
    // Falling asleep (eyes close for a prolonged duration)
    nextState.eyesClosed = true;
    nextState.yawning = false;
    nextState.ear = 0.05 + Math.random() * 0.01;
    // Drowsiness level climbs rapidly
    nextState.drowsyIndex = Math.min(100, nextState.drowsyIndex + 1.2);
  } else {
    // Yawning and recovery
    nextState.eyesClosed = false;
    nextState.yawning = cycle % 120 > 20 && cycle % 120 < 90; // prolonged open mouth
    nextState.ear = 0.28 + Math.sin(frame/15) * 0.01;
    nextState.drowsyIndex = Math.max(10, nextState.drowsyIndex - 0.8);
  }

  // Trigger alert logic if index surpasses setting threshold
  if (nextState.drowsyIndex > drowsinessThreshold && nextState.drowsyIndex - state.drowsyIndex > 0) {
    if (frame % 60 === 0) {
      onAlert(`DROWSINESS ALARM: Driver drowsiness index reached ${Math.round(nextState.drowsyIndex)}%`);
      nextState.alertsTriggered++;
    }
  }

  // DRAW WIREFRAME FACE LANDMARKS
  const centerX = w / 2;
  const centerY = h / 2 - 10;
  
  // Head contour (oval)
  ctx.strokeStyle = nextState.drowsyIndex > drowsinessThreshold ? '#f43f5e' : '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, 80, 110, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Eyebrows
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  // Left eyebrow
  ctx.beginPath();
  ctx.moveTo(centerX - 50, centerY - 45);
  ctx.quadraticCurveTo(centerX - 30, centerY - 55, centerX - 12, centerY - 40);
  ctx.stroke();
  // Right eyebrow
  ctx.beginPath();
  ctx.moveTo(centerX + 12, centerY - 40);
  ctx.quadraticCurveTo(centerX + 30, centerY - 55, centerX + 50, centerY - 45);
  ctx.stroke();

  // EYES (Drawing landmarks and status)
  const drawEye = (x: number, y: number, isClosed: boolean, earVal: number) => {
    ctx.strokeStyle = isClosed ? '#f43f5e' : '#10b981';
    ctx.lineWidth = 2;
    ctx.fillStyle = isClosed ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.05)';

    const eyeH = earVal * 80; // Eye height proportional to EAR

    ctx.beginPath();
    if (isClosed) {
      // Closed line
      ctx.moveTo(x - 22, y);
      ctx.lineTo(x + 22, y);
      ctx.stroke();
    } else {
      // Open eye shape
      ctx.moveTo(x - 22, y);
      ctx.quadraticCurveTo(x, y - eyeH, x + 22, y);
      ctx.quadraticCurveTo(x, y + eyeH, x - 22, y);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      // Pupil
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  drawEye(centerX - 30, centerY - 25, nextState.eyesClosed, nextState.ear);
  drawEye(centerX + 30, centerY - 25, nextState.eyesClosed, nextState.ear);

  // Nose contour
  ctx.strokeStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 20);
  ctx.lineTo(centerX, centerY + 15);
  ctx.lineTo(centerX - 10, centerY + 22);
  ctx.lineTo(centerX + 10, centerY + 22);
  ctx.stroke();

  // Mouth (dynamics of normal vs yawning)
  ctx.strokeStyle = nextState.yawning ? '#f43f5e' : '#38bdf8';
  ctx.fillStyle = nextState.yawning ? 'rgba(244, 63, 94, 0.15)' : 'rgba(56, 189, 248, 0.05)';
  ctx.lineWidth = 2;

  ctx.beginPath();
  if (nextState.yawning) {
    // Large yawning circle
    ctx.ellipse(centerX, centerY + 55, 18, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // Normal smile/neutral curve
    ctx.moveTo(centerX - 25, centerY + 50);
    ctx.quadraticCurveTo(centerX, centerY + 62, centerX + 25, centerY + 50);
    ctx.quadraticCurveTo(centerX, centerY + 54, centerX - 25, centerY + 50);
    ctx.closePath();
    ctx.stroke();
  }

  // Draw face landmarks connecting lines (Holographic effect)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  // Center vertical grid
  ctx.moveTo(centerX, centerY - 100);
  ctx.lineTo(centerX, centerY + 95);
  // Cheek diagonals
  ctx.moveTo(centerX - 30, centerY - 25);
  ctx.lineTo(centerX - 80, centerY);
  ctx.moveTo(centerX + 30, centerY - 25);
  ctx.lineTo(centerX + 80, centerY);
  
  ctx.moveTo(centerX - 30, centerY - 25);
  ctx.lineTo(centerX, centerY + 22);
  ctx.moveTo(centerX + 30, centerY - 25);
  ctx.lineTo(centerX, centerY + 22);
  
  ctx.moveTo(centerX - 25, centerY + 50);
  ctx.lineTo(centerX - 50, centerY + 80);
  ctx.moveTo(centerX + 25, centerY + 50);
  ctx.lineTo(centerX + 50, centerY + 80);
  ctx.stroke();

  // TELEMETRY OVERLAYS
  const panelColor = nextState.drowsyIndex > drowsinessThreshold ? 'rgba(244, 63, 94, 0.95)' : 'rgba(15, 23, 42, 0.85)';
  const borderCol = nextState.drowsyIndex > drowsinessThreshold ? '#f43f5e' : '#38bdf8';

  // EAR Status display
  drawTextBadge(
    ctx, 
    `EAR: ${nextState.ear.toFixed(3)} ${nextState.eyesClosed ? '[CLOSED]' : '[OPEN]'}`, 
    20, 
    h - 45, 
    nextState.eyesClosed ? '#f43f5e' : '#10b981', 
    '#fff',
    11
  );

  // Yawn state display
  if (nextState.yawning) {
    drawTextBadge(ctx, 'YAWN DETECTED ⚠️', centerX - 55, centerY + 100, '#fbbf24', '#000', 10);
  }

  // Status block (Top Right)
  ctx.fillStyle = panelColor;
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 1;
  ctx.fillRect(w - 180, 15, 160, 68);
  ctx.strokeRect(w - 180, 15, 160, 68);

  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = nextState.drowsyIndex > drowsinessThreshold ? '#ffffff' : '#94a3b8';
  ctx.fillText('DROWSINESS MONITOR', w - 170, 30);

  ctx.font = '700 12px "JetBrains Mono", monospace';
  ctx.fillStyle = nextState.drowsyIndex > drowsinessThreshold ? '#fff' : '#fff';
  ctx.fillText(`INDEX: ${Math.round(nextState.drowsyIndex)}%`, w - 170, 48);
  
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = nextState.drowsyIndex > drowsinessThreshold ? '#fee2e2' : '#38bdf8';
  ctx.fillText(
    nextState.drowsyIndex > drowsinessThreshold 
      ? '🚨 WAKE UP ALARM!' 
      : nextState.eyesClosed 
        ? '⚠️ ATTENTION DROPPING' 
        : '🟢 STATUS: ACTIVE', 
    w - 170, 
    68
  );

  // Big warning banner for critical drowsiness
  if (nextState.drowsyIndex > drowsinessThreshold && Math.floor(frame / 8) % 2 === 0) {
    ctx.fillStyle = 'rgba(244, 63, 94, 0.9)';
    ctx.fillRect(w / 2 - 130, 20, 260, 32);
    ctx.fillStyle = '#fff';
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🚨 DROWSINESS WARNING: WAKE UP! 🚨', w / 2, 40);
    ctx.textAlign = 'left';
  }

  // Camera identifier overlay
  ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
  ctx.fillRect(10, 10, 140, 22);
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('📷 IN-CABIN CAMERA', 16, 24);

  return nextState;
};

// ==========================================
// 3. HELMET DETECTION SIMULATOR
// ==========================================
export interface HelmetSimState {
  riders: {
    id: number;
    x: number;
    y: number;
    speed: number;
    hasHelmet: boolean;
    detected: boolean;
    plate: string;
  }[];
  violationsCount: number;
  totalChecked: number;
}

export const initHelmetSim = (): HelmetSimState => {
  return {
    riders: [
      { id: 1, x: -80, y: 110, speed: 4.2, hasHelmet: true, detected: false, plate: 'MH-12-AE-3942' },
      { id: 2, x: -350, y: 160, speed: 4.8, hasHelmet: false, detected: false, plate: 'DL-4C-CK-8022' }
    ],
    violationsCount: 3,
    totalChecked: 15
  };
};

export const drawHelmetSim = (
  canvas: HTMLCanvasElement,
  frame: number,
  state: HelmetSimState,
  onAlert: (msg: string) => void
): HelmetSimState => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return state;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  
  drawGrid(ctx, w, h);

  // Draw perspective lanes
  ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
  ctx.beginPath();
  ctx.moveTo(w * 0.2, 50);
  ctx.lineTo(w * 0.8, 50);
  ctx.lineTo(w, h - 30);
  ctx.lineTo(0, h - 30);
  ctx.closePath();
  ctx.fill();

  // Lane separator line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2, 50);
  ctx.lineTo(w / 2, h - 30);
  ctx.stroke();

  let nextState = { ...state };

  // Loop riders
  nextState.riders = nextState.riders.map(rider => {
    let nextX = rider.x + rider.speed;
    let nextDetected = rider.detected;
    
    // Check if crosses the AI detection line (x = w / 2)
    if (nextX >= w / 2 && !rider.detected) {
      nextDetected = true;
      nextState.totalChecked++;
      if (!rider.hasHelmet) {
        nextState.violationsCount++;
        onAlert(`HELMET VIOLATION: Motorcyclist without helmet detected (License: ${rider.plate})`);
      }
    }
    
    // Recycle rider when moves off-screen
    if (nextX > w + 100) {
      nextX = -200 - Math.random() * 200;
      nextDetected = false;
      // Randomize helmet and license for the next instance
      return {
        ...rider,
        x: nextX,
        detected: nextDetected,
        hasHelmet: Math.random() > 0.45,
        plate: `DL-${Math.floor(1 + Math.random()*9)}C-${String.fromCharCode(65 + Math.floor(Math.random()*26))}${String.fromCharCode(65 + Math.floor(Math.random()*26))}-${Math.floor(1000 + Math.random()*9000)}`
      };
    }

    return { ...rider, x: nextX, detected: nextDetected };
  });

  // Draw detection gate line (Virtual scanning laser)
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(168, 85, 247, 0.5)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(w / 2, 45);
  ctx.lineTo(w / 2, h - 25);
  ctx.stroke();
  ctx.shadowBlur = 0; // Reset

  // Text tag on scanner gate
  drawTextBadge(ctx, 'AI SCAN GATE', w / 2 - 40, 42, 'rgba(168, 85, 247, 0.9)', '#ffffff', 9);

  // Render Riders
  nextState.riders.forEach(rider => {
    if (rider.x < -100 || rider.x > w + 50) return;

    // Draw Motorcyclist outline
    const rx = rider.x;
    const ry = rider.y;

    // Drawn as wireframe shapes
    ctx.lineWidth = 2;
    ctx.strokeStyle = rider.hasHelmet ? '#10b981' : '#f43f5e';
    
    // Draw bike body
    ctx.beginPath();
    ctx.arc(rx - 20, ry + 25, 12, 0, Math.PI * 2); // rear wheel
    ctx.arc(rx + 25, ry + 25, 12, 0, Math.PI * 2); // front wheel
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(rx - 20, ry + 25);
    ctx.lineTo(rx - 5, ry + 5);
    ctx.lineTo(rx + 15, ry + 5);
    ctx.lineTo(rx + 25, ry + 25);
    ctx.stroke();

    // Rider head (circle)
    ctx.beginPath();
    ctx.arc(rx, ry - 15, 9, 0, Math.PI * 2);
    ctx.stroke();
    
    // Rider body
    ctx.beginPath();
    ctx.moveTo(rx, ry - 6);
    ctx.lineTo(rx - 10, ry + 15);
    ctx.lineTo(rx + 5, ry + 15);
    ctx.stroke();

    // Drawing Helmet box
    const boxSize = 28;
    const bx = rx - boxSize/2;
    const by = ry - 32;

    const labelColor = rider.hasHelmet ? '#10b981' : '#f43f5e';
    const tagText = rider.hasHelmet ? 'HELMET_OK' : 'VIOLATION: NO_HELMET';

    // Bounding Box
    drawCVCornerBox(ctx, bx, by, boxSize, boxSize, labelColor);

    // AI Classification Label
    drawTextBadge(ctx, tagText, bx - 10, by - 6, labelColor, '#fff', 9);

    if (!rider.hasHelmet && Math.floor(frame / 10) % 2 === 0) {
      // Draw flashing alert bracket
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(rx, ry - 15, 16, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  // Counter HUD overlay
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(w - 180, 15, 160, 56);
  ctx.strokeRect(w - 180, 15, 160, 56);

  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('HELMET STATISTICS', w - 170, 30);
  ctx.fillStyle = '#fff';
  const complianceRate = nextState.totalChecked === 0 ? 100 : Math.round(((nextState.totalChecked - nextState.violationsCount) / nextState.totalChecked) * 100);
  ctx.fillText(`COMPLIANCE: ${complianceRate}%`, w - 170, 44);
  ctx.fillStyle = '#f43f5e';
  ctx.fillText(`VIOLATIONS: ${nextState.violationsCount}`, w - 170, 58);

  // Render Indian Highway Milestone on bottom left
  ctx.fillStyle = '#10b981'; // Green top for Expressway milestone style
  ctx.beginPath();
  ctx.arc(35, h - 40, 11, Math.PI, 0);
  ctx.lineTo(46, h - 25);
  ctx.lineTo(24, h - 25);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff'; // White bottom
  ctx.fillRect(24, h - 25, 22, 15);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(24, h - 25, 22, 15);
  // Stroke top curve
  ctx.beginPath();
  ctx.arc(35, h - 40, 11, Math.PI, 0);
  ctx.lineTo(46, h - 25);
  ctx.moveTo(24, h - 25);
  ctx.arc(35, h - 40, 11, Math.PI, 0);
  ctx.stroke();

  ctx.fillStyle = '#000000';
  ctx.font = '700 7px "JetBrains Mono", monospace';
  ctx.fillText('MPE', 29, h - 36);
  ctx.font = '600 5px "JetBrains Mono", monospace';
  ctx.fillText('LNV 12', 25, h - 18);

  // Camera identifier overlay
  ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
  ctx.fillRect(10, 10, 205, 22);
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('🔴 LIVE: CAM-01 (MUMBAI-PUNE EXP)', 16, 24);

  return nextState;
};

// ==========================================
// 4. ANPR (AUTOMATIC NUMBER PLATE RECOGNITION)
// ==========================================
export interface ANPRSimState {
  currentCar: {
    plate: string;
    model: string;
    owner: string;
    status: 'CLEAN' | 'WANTED' | 'UNREGISTERED';
    x: number;
    y: number;
    w: number;
    h: number;
    speed: number;
    zoomPlate: boolean;
  } | null;
  recognizedChars: string;
  history: { time: string; plate: string; status: string; confidence: string }[];
}

const mockPlatesDatabase = [
  { plate: 'MH-12-GP-8923', model: 'Honda Civic', owner: 'Rahul Verma', status: 'CLEAN' },
  { plate: 'DL-3C-AY-4521', model: 'Hyundai Creta', owner: 'Amit Sharma', status: 'WANTED' },
  { plate: 'KA-51-MM-0092', model: 'Audi A4', owner: 'Priya Rao', status: 'CLEAN' },
  { plate: 'HR-26-CV-7889', model: 'Maruti Swift', owner: 'Unregistered Vehicle', status: 'UNREGISTERED' },
  { plate: 'UP-16-BZ-5544', model: 'Toyota Fortuner', owner: 'Vikram Singh', status: 'CLEAN' }
];

export const initANPRSim = (): ANPRSimState => {
  return {
    currentCar: null,
    recognizedChars: '',
    history: [
      { time: '18:10:02', plate: 'KA-51-MM-0092', status: 'CLEAN', confidence: '98.4%' },
      { time: '18:12:44', plate: 'UP-16-BZ-5544', status: 'CLEAN', confidence: '97.2%' }
    ]
  };
};

export const drawANPRSim = (
  canvas: HTMLCanvasElement,
  frame: number,
  state: ANPRSimState,
  onAlert: (msg: string) => void
): ANPRSimState => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return state;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  
  drawGrid(ctx, w, h);

  let nextState = { ...state };

  // Loop of cars passing by (cycle of 320 frames)
  const cycle = frame % 320;

  if (cycle === 0 || !nextState.currentCar) {
    const randomData = mockPlatesDatabase[Math.floor(Math.random() * mockPlatesDatabase.length)];
    nextState.currentCar = {
      plate: randomData.plate,
      model: randomData.model,
      owner: randomData.owner,
      status: randomData.status as 'CLEAN' | 'WANTED' | 'UNREGISTERED',
      x: -120,
      y: h / 2 - 25,
      w: 80,
      h: 40,
      speed: 3.8,
      zoomPlate: false
    };
    nextState.recognizedChars = '';
  }

  const car = nextState.currentCar;

  // Update car position
  if (car) {
    car.x += car.speed;
    
    // Zoom/ANPR trigger point
    if (car.x > w * 0.35 && car.x < w * 0.7) {
      car.speed = 0.8; // Slow down for OCR processing
      car.zoomPlate = true;
      
      // Simulate typing OCR text character by character
      const targetLength = car.plate.length;
      const charsAvailable = Math.min(targetLength, Math.floor((car.x - w * 0.35) / 10));
      nextState.recognizedChars = car.plate.slice(0, charsAvailable);
      
      if (charsAvailable === targetLength && nextState.recognizedChars === car.plate && !nextState.history.some(h => h.plate === car.plate)) {
        // Recognition complete! Push to history
        const date = new Date();
        const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
        
        nextState.history = [
          { 
            time: timeStr, 
            plate: car.plate, 
            status: car.status, 
            confidence: `${(95 + Math.random() * 4.9).toFixed(1)}%` 
          },
          ...nextState.history.slice(0, 4) // cap list size
        ];

        // Trigger safety alert if wanted/unregistered
        if (car.status === 'WANTED') {
          onAlert(`ANPR WARNING: Wanted Vehicle License ${car.plate} detected on Highway Checkpost!`);
        } else if (car.status === 'UNREGISTERED') {
          onAlert(`ANPR ALERT: Unregistered/Stolen vehicle license match ${car.plate}`);
        }
      }
    } else {
      car.speed = 4.2; // Speed off
      car.zoomPlate = false;
    }
  }

  // Draw simulated road lane
  ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
  ctx.fillRect(0, h / 2 - 40, w, 80);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h / 2 - 40); ctx.lineTo(w, h / 2 - 40);
  ctx.moveTo(0, h / 2 + 40); ctx.lineTo(w, h / 2 + 40);
  ctx.stroke();

  // Render passing car
  if (car && car.x < w + 50) {
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.strokeRect(car.x, car.y, car.w, car.h);
    
    // Draw wheels
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(car.x + 10, car.y + car.h, 12, 4);
    ctx.fillRect(car.x + car.w - 22, car.y + car.h, 12, 4);

    // Draw yellow license plate on rear of car
    const plateWidth = 28;
    const plateHeight = 10;
    const px = car.x + car.w - plateWidth - 2;
    const py = car.y + car.h / 2 - 2;

    ctx.fillStyle = '#fef08a'; // yellow plate
    ctx.fillRect(px, py, plateWidth, plateHeight);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(px, py, plateWidth, plateHeight);

    // License plate crop box visualization
    if (car.zoomPlate) {
      drawCVCornerBox(ctx, px - 6, py - 6, plateWidth + 12, plateHeight + 12, '#a855f7', 1.5, 5);
      
      // Connecting holographic lines to magnifying window
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px - 6, py - 6);
      ctx.lineTo(20, h - 80);
      ctx.moveTo(px + plateWidth + 6, py + plateHeight + 6);
      ctx.lineTo(180, h - 15);
      ctx.stroke();
    }
  }

  // Draw Scanning radar overlay
  if (car && car.zoomPlate) {
    // Red/Purple scanning area
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.strokeRect(w * 0.35, h / 2 - 45, w * 0.35, 90);
    
    // Scanner sweep line
    const sweepY = (h / 2 - 45) + Math.abs(Math.sin(frame / 8)) * 90;
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
    ctx.beginPath();
    ctx.moveTo(w * 0.35, sweepY);
    ctx.lineTo(w * 0.70, sweepY);
    ctx.stroke();
    
    drawTextBadge(ctx, 'OCR CAPTURE ZONE', w * 0.35 + 4, h / 2 - 50, 'rgba(168, 85, 247, 0.95)', '#fff', 9);
  }

  // ANPR MAGNIFIED SCANNER PANEL (Bottom Left overlay)
  if (car && car.zoomPlate) {
    ctx.fillStyle = 'rgba(13, 20, 38, 0.9)';
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.5;
    ctx.fillRect(15, h - 90, 200, 75);
    ctx.strokeRect(15, h - 90, 200, 75);
    
    // Red scanner laser inside panel
    ctx.fillStyle = 'rgba(168, 85, 247, 0.1)';
    ctx.fillRect(17, h - 88, 196, 71);
    
    // Enlarged License Plate drawing
    ctx.fillStyle = '#fbbf24'; // retro reflective yellow
    ctx.fillRect(25, h - 70, 180, 30);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(25, h - 70, 180, 30);

    // Enlarged text rendering character by character
    ctx.font = '700 15px "JetBrains Mono", monospace';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText(nextState.recognizedChars, 25 + 90, h - 50);
    ctx.textAlign = 'left'; // reset

    // Status of scanned vehicle
    let statusCol = '#10b981';
    if (car.status === 'WANTED') statusCol = '#f43f5e';
    if (car.status === 'UNREGISTERED') statusCol = '#fbbf24';
    
    drawTextBadge(ctx, `MATCH: ${car.status}`, 25, h - 35, statusCol, '#fff', 9);
    drawTextBadge(ctx, car.model, 120, h - 35, 'rgba(30, 41, 59, 0.8)', '#fff', 9);
  }

  // Render Indian Highway Milestone on bottom left
  ctx.fillStyle = '#10b981'; // Green top for Expressway milestone style
  ctx.beginPath();
  ctx.arc(35, h - 40, 11, Math.PI, 0);
  ctx.lineTo(46, h - 25);
  ctx.lineTo(24, h - 25);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff'; // White bottom
  ctx.fillRect(24, h - 25, 22, 15);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(24, h - 25, 22, 15);
  // Stroke top curve
  ctx.beginPath();
  ctx.arc(35, h - 40, 11, Math.PI, 0);
  ctx.lineTo(46, h - 25);
  ctx.moveTo(24, h - 25);
  ctx.arc(35, h - 40, 11, Math.PI, 0);
  ctx.stroke();

  ctx.fillStyle = '#000000';
  ctx.font = '700 7px "JetBrains Mono", monospace';
  ctx.fillText('DND', 29, h - 36);
  ctx.font = '600 5px "JetBrains Mono", monospace';
  ctx.fillText('ND 0.5', 25, h - 18);

  // Camera identifier overlay
  ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
  ctx.fillRect(10, 10, 210, 22);
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('🔍 LIVE: CAM-04 (DND FLYWAY - ANPR)', 16, 24);

  return nextState;
};

// ==========================================
// 5. TRAFFIC MONITORING & SPEED ESTIMATOR
// ==========================================
export interface TrafficSimState {
  vehicles: {
    id: number;
    x: number;
    y: number;
    w: number;
    h: number;
    speed: number; // raw pixel speed
    speedKmh: number; // converted km/h
    type: 'CAR' | 'TRUCK' | 'MOTORBIKE';
    crossed: boolean;
    color: string;
  }[];
  vehicleCount: number;
  avgSpeed: number;
  totalSpeedSum: number;
}

export const initTrafficSim = (): TrafficSimState => {
  return {
    vehicles: [
      { id: 101, x: 20, y: 70, w: 42, h: 22, speed: 2.2, speedKmh: 68, type: 'CAR', crossed: false, color: '#38bdf8' },
      { id: 102, x: 250, y: 130, w: 60, h: 32, speed: 1.8, speedKmh: 54, type: 'TRUCK', crossed: false, color: '#fbbf24' },
      { id: 103, x: -100, y: 190, w: 25, h: 16, speed: 3.5, speedKmh: 108, type: 'MOTORBIKE', crossed: false, color: '#f43f5e' }
    ],
    vehicleCount: 42,
    avgSpeed: 72,
    totalSpeedSum: 3024
  };
};

export const drawTrafficSim = (
  canvas: HTMLCanvasElement,
  frame: number,
  state: TrafficSimState,
  speedLimit: number,
  onAlert: (msg: string) => void
): TrafficSimState => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return state;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  
  drawGrid(ctx, w, h);

  // Draw 3-lane Highway
  ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
  ctx.fillRect(0, 50, w, 180);
  
  // Lane Dividers
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(0, 110); ctx.lineTo(w, 110);
  ctx.moveTo(0, 170); ctx.lineTo(w, 170);
  ctx.stroke();
  ctx.setLineDash([]); // reset

  // Highway borders
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 50); ctx.lineTo(w, 50);
  ctx.moveTo(0, 230); ctx.lineTo(w, 230);
  ctx.stroke();

  let nextState = { ...state };

  // Speed trap counting line (x = w * 0.6)
  const lineX = w * 0.6;
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(lineX, 50);
  ctx.lineTo(lineX, 230);
  ctx.stroke();
  
  drawTextBadge(ctx, 'SPEED TRAP LINE', lineX - 45, 46, 'rgba(16, 185, 129, 0.85)', '#fff', 9);

  // Update vehicles
  nextState.vehicles = nextState.vehicles.map(v => {
    let nextX = v.x + v.speed;
    let nextCrossed = v.crossed;

    if (nextX >= lineX && !v.crossed) {
      nextCrossed = true;
      nextState.vehicleCount++;
      nextState.totalSpeedSum += v.speedKmh;
      nextState.avgSpeed = Math.round(nextState.totalSpeedSum / nextState.vehicleCount);
      
      // Trigger Speeding Violation Alert
      if (v.speedKmh > speedLimit) {
        onAlert(`TRAFFIC VIOLATION: Speeding detected! ID #${v.id} traveling at ${v.speedKmh} km/h (Limit: ${speedLimit} km/h)`);
      }
    }

    // Recycle vehicles
    if (nextX > w + 80) {
      nextX = -120;
      nextCrossed = false;
      
      // Randomize speed and type
      const randType = Math.random();
      let type: 'CAR' | 'TRUCK' | 'MOTORBIKE' = 'CAR';
      let speedVal = 2.0 + Math.random() * 1.5;
      let wVal = 44;
      let hVal = 22;
      let col = '#38bdf8';

      if (randType > 0.7) {
        type = 'TRUCK';
        speedVal = 1.3 + Math.random() * 0.8;
        wVal = 62;
        hVal = 32;
        col = '#fbbf24';
      } else if (randType < 0.25) {
        type = 'MOTORBIKE';
        speedVal = 3.0 + Math.random() * 1.8;
        wVal = 24;
        hVal = 14;
        col = '#f43f5e';
      }

      // Convert speed to realistic km/h
      const speedKmh = Math.round(speedVal * 28);
      const nextId = 100 + Math.floor(Math.random() * 900);

      return {
        id: nextId,
        x: nextX,
        y: v.y, // keep in same lane
        w: wVal,
        h: hVal,
        speed: speedVal,
        speedKmh,
        type,
        crossed: nextCrossed,
        color: col
      };
    }

    return { ...v, x: nextX, crossed: nextCrossed };
  });

  // Render Vehicles
  nextState.vehicles.forEach(v => {
    if (v.x < -80 || v.x > w + 50) return;

    // Core body wireframe
    ctx.strokeStyle = v.color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(v.x, v.y, v.w, v.h);

    // Dynamic Indian Truck layout overlays
    if (v.type === 'TRUCK') {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
      ctx.fillRect(v.x, v.y, v.w, v.h);
      ctx.fillStyle = '#fbbf24';
      ctx.font = '700 6px "JetBrains Mono", monospace';
      ctx.fillText('HORN', v.x + 4, v.y + 12);
      ctx.fillText('OK', v.x + 6, v.y + 20);
      ctx.fillText('PLEASE', v.x + 4, v.y + 28);
    }

    // AI recognition box (glowing green/red based on speed limit)
    const isSpeeding = v.speedKmh > speedLimit;
    const boxColor = isSpeeding ? 'rgba(244, 63, 94, 1)' : 'rgba(56, 189, 248, 1)';
    drawCVCornerBox(ctx, v.x - 3, v.y - 3, v.w + 6, v.h + 6, boxColor);

    // Velocity tracer dot trail
    ctx.fillStyle = v.color;
    ctx.beginPath();
    ctx.arc(v.x - 8, v.y + v.h/2, 2, 0, Math.PI * 2);
    ctx.arc(v.x - 16, v.y + v.h/2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // AI Telemetry Badge above vehicle
    const label = `${v.type} #${v.id} | ${v.speedKmh} km/h`;
    drawTextBadge(ctx, label, v.x - 3, v.y - 8, isSpeeding ? '#f43f5e' : 'rgba(15, 23, 42, 0.85)', '#fff', 9);

    // Highlight Speeding Violators with red warning circle
    if (isSpeeding && Math.floor(frame / 8) % 2 === 0) {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(v.x + v.w/2, v.y + v.h/2, Math.max(v.w, v.h) * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  // Highway HUD Analytics overlay
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(w - 180, h - 85, 160, 68);
  ctx.strokeRect(w - 180, h - 85, 160, 68);

  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('SPEEDWAY METRICS', w - 170, h - 70);
  ctx.fillStyle = '#fff';
  ctx.fillText(`TOTAL COUNT: ${nextState.vehicleCount}`, w - 170, h - 54);
  ctx.fillText(`AVG SPEED  : ${nextState.avgSpeed} km/h`, w - 170, h - 38);

  // Render Indian Highway Milestone on bottom left
  ctx.fillStyle = '#fbbf24'; // Yellow top
  ctx.beginPath();
  ctx.arc(35, h - 40, 11, Math.PI, 0);
  ctx.lineTo(46, h - 25);
  ctx.lineTo(24, h - 25);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff'; // White bottom
  ctx.fillRect(24, h - 25, 22, 15);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(24, h - 25, 22, 15);
  // Stroke top curve
  ctx.beginPath();
  ctx.arc(35, h - 40, 11, Math.PI, 0);
  ctx.lineTo(46, h - 25);
  ctx.moveTo(24, h - 25);
  ctx.arc(35, h - 40, 11, Math.PI, 0);
  ctx.stroke();

  ctx.fillStyle = '#000000';
  ctx.font = '700 7px "JetBrains Mono", monospace';
  ctx.fillText('NH 44', 26, h - 36);
  ctx.font = '600 5px "JetBrains Mono", monospace';
  ctx.fillText('BLR 24', 25, h - 18);

  // Camera identifier overlay
  ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
  ctx.fillRect(10, 10, 230, 22);
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('🛣️ LIVE: CAM-02 (NH 44 - BENGALURU-HYD)', 16, 24);

  return nextState;
};
