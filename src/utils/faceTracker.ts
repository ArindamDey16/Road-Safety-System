import { drawCVCornerBox, drawTextBadge } from './cvSimulators';

export interface FaceTrackerResult {
  faceDetected: boolean;
  faceRect: { x: number; y: number; w: number; h: number } | null;
  leftEyeRect: { x: number; y: number; w: number; h: number } | null;
  rightEyeRect: { x: number; y: number; w: number; h: number } | null;
  mouthRect: { x: number; y: number; w: number; h: number } | null;
  ear: number; // Eye Aspect Ratio
  mar: number; // Mouth Aspect Ratio (Yawn detector)
  isClosed: boolean;
  isYawning: boolean;
}

/**
 * Custom JavaScript computer vision tracker.
 * Analyzes video pixel data to segment face region based on skin-tone heuristics,
 * then uses luminance minima (dark regions) inside the face bounds to isolate eyes and mouth.
 */
export const trackFaceWebcam = (
  video: HTMLVideoElement,
  overlayCanvas: HTMLCanvasElement
): FaceTrackerResult => {
  const result: FaceTrackerResult = {
    faceDetected: false,
    faceRect: null,
    leftEyeRect: null,
    rightEyeRect: null,
    mouthRect: null,
    ear: 0.3,
    mar: 0.15,
    isClosed: false,
    isYawning: false
  };

  const ctx = overlayCanvas.getContext('2d');
  if (!ctx || video.paused || video.ended) {
    return result;
  }

  const w = overlayCanvas.width;
  const h = overlayCanvas.height;

  // Clear previous frame overlays
  ctx.clearRect(0, 0, w, h);

  // We create a temporary canvas to get raw pixel access
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 120; // Downsample for 60fps performance
  tempCanvas.height = 90;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return result;

  // Draw the current video frame downscaled
  tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
  const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  const data = imgData.data;

  // 1. SKIN TONE SEGMENTATION (Find bounding box of face)
  // Skin tone range in RGB: R > 95, G > 40, B > 20, max(RGB) - min(RGB) > 15, |R - G| > 15, R > G, R > B
  let minX = tempCanvas.width;
  let maxX = 0;
  let minY = tempCanvas.height;
  let maxY = 0;
  let skinPixelCount = 0;

  for (let y = 0; y < tempCanvas.height; y++) {
    for (let x = 0; x < tempCanvas.width; x++) {
      const idx = (y * tempCanvas.width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);

      const isSkin = 
        r > 70 && g > 35 && b > 20 &&
        (max - min) > 12 &&
        Math.abs(r - g) > 12 &&
        r > g && r > b;

      if (isSkin) {
        skinPixelCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Check if we found a sufficient blob of skin pixels to declare a face
  const faceW = maxX - minX;
  const faceH = maxY - minY;
  const area = faceW * faceH;

  if (skinPixelCount > 300 && faceW > 25 && faceH > 35 && area > 1000) {
    result.faceDetected = true;
    
    // Scale coordinates back to original overlay canvas size
    const scaleX = w / tempCanvas.width;
    const scaleY = h / tempCanvas.height;

    // Apply smoothing to coordinates to prevent jitter
    result.faceRect = {
      x: minX * scaleX,
      y: minY * scaleY,
      w: faceW * scaleX,
      h: faceH * scaleY
    };

    // 2. DETECT EYE REGIONS (Search for luminance minima in the top half of the face)
    const face = result.faceRect;
    
    // Left eye region (Top-Left quadrant of face box)
    const eyeAreaW = Math.round(face.w * 0.35);
    const eyeAreaH = Math.round(face.h * 0.22);
    
    const leftEyeRegion = {
      x: face.x + Math.round(face.w * 0.12),
      y: face.y + Math.round(face.h * 0.25),
      w: eyeAreaW,
      h: eyeAreaH
    };

    // Right eye region (Top-Right quadrant of face box)
    const rightEyeRegion = {
      x: face.x + Math.round(face.w * 0.53),
      y: face.y + Math.round(face.h * 0.25),
      w: eyeAreaW,
      h: eyeAreaH
    };

    // Mouth region (Bottom Center of face box)
    const mouthRegion = {
      x: face.x + Math.round(face.w * 0.25),
      y: face.y + Math.round(face.h * 0.60),
      w: Math.round(face.w * 0.5),
      h: Math.round(face.h * 0.22)
    };

    result.leftEyeRect = leftEyeRegion;
    result.rightEyeRect = rightEyeRegion;
    result.mouthRect = mouthRegion;

    // 3. ANALYZE LUMINANCE FOR EAR (Eye Aspect Ratio) & MAR (Mouth Aspect Ratio)
    // We scan the pixels in the eye regions to find the dark pupil height.
    // If the eyes are closed, the average luminance in the eye box is higher (skin color) 
    // and there is no concentrated dark circle.
    
    const scanEyeHeight = (region: { x: number; y: number; w: number; h: number }): number => {
      // Helper to map original coordinates to downsampled canvas coordinates
      const tx = Math.round(region.x / scaleX);
      const ty = Math.round(region.y / scaleY);
      const tw = Math.round(region.w / scaleX);
      const th = Math.round(region.h / scaleY);

      // Find average luminance and minimum luminance (darkest pixels)
      let minLumi = 255;
      let totalLumi = 0;
      let count = 0;
      
      const pixelLuminances: number[][] = Array(th).fill(0).map(() => Array(tw).fill(255));

      for (let y = 0; y < th; y++) {
        for (let x = 0; x < tw; x++) {
          const px = tx + x;
          const py = ty + y;
          if (px >= 0 && px < tempCanvas.width && py >= 0 && py < tempCanvas.height) {
            const idx = (py * tempCanvas.width + px) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            
            // Standard relative luminance
            const lumi = 0.299 * r + 0.587 * g + 0.114 * b;
            pixelLuminances[y][x] = lumi;
            totalLumi += lumi;
            count++;
            if (lumi < minLumi) minLumi = lumi;
          }
        }
      }

      const avgLumi = totalLumi / (count || 1);
      
      // We threshold the eye box for dark pixels (iris/pupil/eyebrows)
      // Threshold is set slightly below the average local luminance
      const darkThreshold = minLumi + (avgLumi - minLumi) * 0.4;
      
      // Calculate vertical height of the dark blob
      let darkRows = 0;
      for (let y = 0; y < th; y++) {
        let hasDarkPixelInRow = false;
        for (let x = 0; x < tw; x++) {
          if (pixelLuminances[y][x] < darkThreshold) {
            hasDarkPixelInRow = true;
            break;
          }
        }
        if (hasDarkPixelInRow) darkRows++;
      }

      // Eye Aspect Ratio estimation: ratio of dark vertical lines to width of eye region
      return darkRows / (th || 1) * 0.4;
    };

    const scanMouthHeight = (region: { x: number; y: number; w: number; h: number }): number => {
      const tx = Math.round(region.x / scaleX);
      const ty = Math.round(region.y / scaleY);
      const tw = Math.round(region.w / scaleX);
      const th = Math.round(region.h / scaleY);

      // A yawn creates a very dark shadow inside the open mouth cavity.
      // We calculate the fraction of dark pixels inside the mouth region.
      let darkMouthPixels = 0;
      let totalPixels = 0;

      for (let y = 0; y < th; y++) {
        for (let x = 0; x < tw; x++) {
          const px = tx + x;
          const py = ty + y;
          if (px >= 0 && px < tempCanvas.width && py >= 0 && py < tempCanvas.height) {
            const idx = (py * tempCanvas.width + px) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const lumi = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // The inner mouth cavity is usually much darker than surrounding skin
            if (lumi < 55) { 
              darkMouthPixels++;
            }
            totalPixels++;
          }
        }
      }

      return darkMouthPixels / (totalPixels || 1);
    };

    const leftEar = scanEyeHeight(leftEyeRegion);
    const rightEar = scanEyeHeight(rightEyeRegion);
    
    // Average EAR of both eyes
    result.ear = Number(((leftEar + rightEar) / 2).toFixed(3));
    result.mar = Number(scanMouthHeight(mouthRegion).toFixed(3));

    // Decision Logic
    result.isClosed = result.ear < 0.12; // closed eye threshold
    result.isYawning = result.mar > 0.18; // mouth open yawn threshold

    // 4. DRAW OVERLAYS ON SCREEN
    // Draw face bounding box
    ctx.strokeStyle = result.isClosed || result.isYawning ? 'rgba(244, 63, 94, 0.95)' : 'rgba(56, 189, 248, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(face.x, face.y, face.w, face.h);
    
    // Draw corner notches on face
    drawCVCornerBox(ctx, face.x - 2, face.y - 2, face.w + 4, face.h + 4, result.isClosed ? 'rgba(244, 63, 94, 1)' : 'rgba(56, 189, 248, 1)', 2, 16);

    // Draw eye boundaries
    ctx.strokeStyle = result.isClosed ? '#f43f5e' : '#10b981';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(leftEyeRegion.x, leftEyeRegion.y, leftEyeRegion.w, leftEyeRegion.h);
    ctx.strokeRect(rightEyeRegion.x, rightEyeRegion.y, rightEyeRegion.w, rightEyeRegion.h);

    // Crosshairs on pupil estimates
    ctx.fillStyle = result.isClosed ? '#f43f5e' : '#10b981';
    ctx.beginPath();
    ctx.arc(leftEyeRegion.x + leftEyeRegion.w/2, leftEyeRegion.y + leftEyeRegion.h/2, 3, 0, Math.PI*2);
    ctx.arc(rightEyeRegion.x + rightEyeRegion.w/2, rightEyeRegion.y + rightEyeRegion.h/2, 3, 0, Math.PI*2);
    ctx.fill();

    // Draw mouth boundary
    ctx.strokeStyle = result.isYawning ? '#f43f5e' : '#fbbf24';
    ctx.strokeRect(mouthRegion.x, mouthRegion.y, mouthRegion.w, mouthRegion.h);

    // Display telemetry values beside bounding boxes
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#fff';
    
    // Text badges
    drawTextBadge(ctx, `FACE_ACTIVE | EAR: ${result.ear.toFixed(2)}`, face.x + 4, face.y - 8, result.isClosed ? '#f43f5e' : '#1e293b', '#fff', 9);
    drawTextBadge(ctx, result.isClosed ? 'CLOSED 🚨' : 'OPEN', leftEyeRegion.x, leftEyeRegion.y - 6, result.isClosed ? '#f43f5e' : '#10b981', '#fff', 8);
    drawTextBadge(ctx, result.isYawning ? 'YAWN DETECTED ⚠️' : 'MOUTH_OK', mouthRegion.x, mouthRegion.y - 6, result.isYawning ? '#f43f5e' : '#fbbf24', '#000', 8);

    // Alert flashing if drowsiness warning triggered
    if (result.isClosed) {
      ctx.fillStyle = 'rgba(244, 63, 94, 0.15)';
      ctx.fillRect(0, 0, w, h);
      
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, w, h);
    }
  } else {
    // Face not detected
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.fillRect(0, 0, w, h);
    
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillStyle = '#f43f5e';
    ctx.textAlign = 'center';
    ctx.fillText('⚠️ NO FACE DETECTED in active region', w / 2, h / 2);
    ctx.textAlign = 'left';
  }

  return result;
};
