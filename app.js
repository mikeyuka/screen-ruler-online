/**
 * Screen Ruler Online (SRO) - Main Application Script
 * High-performance, client-side dynamic scaling utility.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const state = {
    ppi: 96, // Default Pixels Per Inch
    theme: 'light',
    ruler: {
      widthPx: 800,
      heightPx: 120,
      x: 100,
      y: 150,
      isVertical: false,
      color: '#0284c7', // Primary Tailwind sky-600
      isLocked: false,
      lockDragging: false,
    },
    calibration: {
      selectedObject: 'card_width',
      boxWidthPx: 323, // Initial size close to default card size at 96 PPI
    },
    protractor: {
      pivot: { x: 300, y: 200 },
      arm1: { x: 450, y: 200 }, // Base arm (radial length 150px)
      arm2: { x: 406, y: 94 },  // Measuring arm (radial length 150px, initially 45 deg)
      showReflex: false,
      activeHandle: null,
    },
  };

  // Dimensions of standard reference objects (in inches)
  const REF_OBJECTS = {
    card_width: { name: 'Credit Card / ID (Width)', inches: 3.37007874, mm: 85.60 },
    card_height: { name: 'Credit Card / ID (Height)', inches: 2.12519685, mm: 53.98 },
    dollar_width: { name: 'US Dollar Bill ($1)', inches: 6.14566929, mm: 156.10 },
    quarter_diameter: { name: 'US Quarter Coin', inches: 0.95511811, mm: 24.26 },
    euro_diameter: { name: 'Euro €1 Coin', inches: 0.91535433, mm: 23.25 },
    pound_diameter: { name: 'UK Pound £1 Coin', inches: 0.92244094, mm: 23.43 },
  };

  // ==========================================
  // CORE FUNCTIONS: PERSISTENCE & THEME
  // ==========================================
  function initApp() {
    // 1. Load Theme
    const savedTheme = localStorage.getItem('sro_theme');
    if (savedTheme) {
      state.theme = savedTheme;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      state.theme = 'dark';
    }
    applyTheme();

    // 2. Load PPI
    const savedPPI = localStorage.getItem('sro_calibrated_ppi');
    if (savedPPI) {
      state.ppi = parseFloat(savedPPI);
      showNotification(`Calibrated PPI loaded: ${state.ppi.toFixed(2)} PPI`);
    } else {
      state.ppi = 96;
    }

    // 3. Load Ruler Settings
    const savedRuler = localStorage.getItem('sro_ruler_settings');
    if (savedRuler) {
      try {
        const parsed = JSON.parse(savedRuler);
        state.ruler = { ...state.ruler, ...parsed };
      } catch (e) {
        console.error('Error parsing ruler settings', e);
      }
    }

    // Update Form Inputs with Loaded PPI
    document.getElementById('manual-ppi-input').value = Math.round(state.ppi * 100) / 100;
    updateCalibrationBoxWidthFromPPI();

    // Init UI States
    syncThemeToggleUI();
    renderRuler();
    renderProtractor();
    updateConverter('px', 100); // Trigger initial conversions
    setupEventListeners();
  }

  function savePPI(newPPI) {
    if (isNaN(newPPI) || newPPI <= 0) return;
    state.ppi = newPPI;
    localStorage.setItem('sro_calibrated_ppi', newPPI);
    document.getElementById('manual-ppi-input').value = Math.round(newPPI * 100) / 100;
    
    // Broadcast updates
    renderRuler();
    // Re-trigger active conversion with current px baseline
    const currentPx = parseFloat(document.getElementById('conv-px').value) || 100;
    updateConverter('px', currentPx);
  }

  function applyTheme() {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('sro_theme', state.theme);
  }

  function syncThemeToggleUI() {
    const lightIcon = document.getElementById('theme-toggle-light-icon');
    const darkIcon = document.getElementById('theme-toggle-dark-icon');
    if (state.theme === 'dark') {
      lightIcon.classList.remove('hidden');
      darkIcon.classList.add('hidden');
    } else {
      lightIcon.classList.add('hidden');
      darkIcon.classList.remove('hidden');
    }
  }

  function showNotification(message) {
    const banner = document.getElementById('toast-notification');
    const textSpan = document.getElementById('toast-message');
    if (!banner || !textSpan) return;
    textSpan.textContent = message;
    banner.classList.remove('translate-y-24', 'opacity-0');
    banner.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
      banner.classList.remove('translate-y-0', 'opacity-100');
      banner.classList.add('translate-y-24', 'opacity-0');
    }, 4000);
  }

  // ==========================================
  // RULER MODULE
  // ==========================================
  const rulerEl = document.getElementById('floating-ruler');
  const rulerSvg = document.getElementById('ruler-scale-svg');

  function renderRuler() {
    if (!rulerEl || !rulerSvg) return;

    // Apply basic styles
    rulerEl.style.left = `${state.ruler.x}px`;
    rulerEl.style.top = `${state.ruler.y}px`;
    rulerEl.style.borderColor = state.ruler.color;
    
    const rulerContent = document.getElementById('ruler-content');
    if (rulerContent) {
      rulerContent.style.backgroundColor = state.theme === 'dark' ? '#1f2937' : '#ffffff';
    }

    if (state.ruler.isVertical) {
      rulerEl.style.width = `${state.ruler.heightPx}px`;
      rulerEl.style.height = `${state.ruler.widthPx}px`;
      rulerSvg.setAttribute('width', state.ruler.heightPx);
      rulerSvg.setAttribute('height', state.ruler.widthPx);
    } else {
      rulerEl.style.width = `${state.ruler.widthPx}px`;
      rulerEl.style.height = `${state.ruler.heightPx}px`;
      rulerSvg.setAttribute('width', state.ruler.widthPx);
      rulerSvg.setAttribute('height', state.ruler.heightPx);
    }

    // Clear SVG
    rulerSvg.innerHTML = '';

    // Draw scale ticks
    const ppi = state.ppi;
    const isVertical = state.ruler.isVertical;
    const rulerLength = state.ruler.widthPx;
    const rulerThickness = state.ruler.heightPx;

    const gMetric = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gMetric.setAttribute('class', 'stroke-gray-500 dark:stroke-gray-400 fill-gray-800 dark:fill-gray-200 text-[10px] font-sans select-none');
    gMetric.setAttribute('stroke-width', '1');

    const gImperial = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gImperial.setAttribute('class', 'stroke-gray-500 dark:stroke-gray-400 fill-gray-800 dark:fill-gray-200 text-[10px] font-sans select-none');
    gImperial.setAttribute('stroke-width', '1');

    // 1. Metric: Ticks every Millimeter (mm)
    const mmStep = ppi / 25.4;
    const totalMm = Math.floor(rulerLength / mmStep);

    for (let i = 0; i <= totalMm; i++) {
      const pos = i * mmStep;
      let tickHeight = 8;
      let showLabel = false;

      if (i % 10 === 0) {
        tickHeight = 22;
        showLabel = true;
      } else if (i % 5 === 0) {
        tickHeight = 14;
      }

      if (isVertical) {
        // Metric on LEFT side, y coordinate is pos
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '0');
        line.setAttribute('y1', pos.toFixed(2));
        line.setAttribute('x2', tickHeight.toString());
        line.setAttribute('y2', pos.toFixed(2));
        gMetric.appendChild(line);

        if (showLabel && pos < rulerLength - 10) {
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', '26');
          text.setAttribute('y', (pos + 3).toFixed(2));
          text.setAttribute('stroke-width', '0');
          text.textContent = (i / 10).toString();
          gMetric.appendChild(text);
        }
      } else {
        // Metric on TOP side, x coordinate is pos
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', pos.toFixed(2));
        line.setAttribute('y1', '0');
        line.setAttribute('x2', pos.toFixed(2));
        line.setAttribute('y2', tickHeight.toString());
        gMetric.appendChild(line);

        if (showLabel && pos < rulerLength - 10) {
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', pos.toFixed(2));
          text.setAttribute('y', '32');
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('stroke-width', '0');
          text.textContent = (i / 10).toString();
          gMetric.appendChild(text);
        }
      }
    }

    // Add metric system indicator
    const metricUnitLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    metricUnitLabel.setAttribute('stroke-width', '0');
    metricUnitLabel.setAttribute('class', 'fill-gray-400 text-[9px] font-bold');
    if (isVertical) {
      metricUnitLabel.setAttribute('x', '10');
      metricUnitLabel.setAttribute('y', '15');
      metricUnitLabel.textContent = 'cm';
    } else {
      metricUnitLabel.setAttribute('x', '10');
      metricUnitLabel.setAttribute('y', '28');
      metricUnitLabel.textContent = 'cm';
    }
    gMetric.appendChild(metricUnitLabel);

    // 2. Imperial: Ticks every 1/16th of an inch
    const inchStep = ppi / 16;
    const totalSixteenths = Math.floor(rulerLength / inchStep);

    for (let j = 0; j <= totalSixteenths; j++) {
      const pos = j * inchStep;
      let tickHeight = 6;
      let showLabel = false;

      if (j % 16 === 0) {
        tickHeight = 24;
        showLabel = true;
      } else if (j % 8 === 0) {
        tickHeight = 18;
      } else if (j % 4 === 0) {
        tickHeight = 13;
      } else if (j % 2 === 0) {
        tickHeight = 9;
      }

      if (isVertical) {
        // Imperial on RIGHT side, y coordinate is pos
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', rulerThickness.toString());
        line.setAttribute('y1', pos.toFixed(2));
        line.setAttribute('x2', (rulerThickness - tickHeight).toString());
        line.setAttribute('y2', pos.toFixed(2));
        gImperial.appendChild(line);

        if (showLabel && pos < rulerLength - 10) {
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', (rulerThickness - 30).toString());
          text.setAttribute('y', (pos + 3).toFixed(2));
          text.setAttribute('stroke-width', '0');
          text.setAttribute('text-anchor', 'end');
          text.textContent = (j / 16).toString();
          gImperial.appendChild(text);
        }
      } else {
        // Imperial on BOTTOM side, x coordinate is pos
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', pos.toFixed(2));
        line.setAttribute('y1', rulerThickness.toString());
        line.setAttribute('x2', pos.toFixed(2));
        line.setAttribute('y2', (rulerThickness - tickHeight).toString());
        gImperial.appendChild(line);

        if (showLabel && pos < rulerLength - 10) {
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', pos.toFixed(2));
          text.setAttribute('y', (rulerThickness - 28).toString());
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('stroke-width', '0');
          text.textContent = (j / 16).toString();
          gImperial.appendChild(text);
        }
      }
    }

    // Add imperial system indicator
    const imperialUnitLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    imperialUnitLabel.setAttribute('stroke-width', '0');
    imperialUnitLabel.setAttribute('class', 'fill-gray-400 text-[9px] font-bold');
    if (isVertical) {
      imperialUnitLabel.setAttribute('x', (rulerThickness - 18).toString());
      imperialUnitLabel.setAttribute('y', '15');
      imperialUnitLabel.textContent = 'inch';
    } else {
      imperialUnitLabel.setAttribute('x', '10');
      imperialUnitLabel.setAttribute('y', (rulerThickness - 12).toString());
      imperialUnitLabel.textContent = 'inch';
    }
    gImperial.appendChild(imperialUnitLabel);

    rulerSvg.appendChild(gMetric);
    rulerSvg.appendChild(gImperial);

    // Update dimensions on info display (if any)
    document.getElementById('ruler-w-info').textContent = Math.round(rulerLength);
    document.getElementById('ruler-h-info').textContent = Math.round(rulerThickness);
    document.getElementById('ruler-l-in').textContent = (rulerLength / ppi).toFixed(2);
    document.getElementById('ruler-l-cm').textContent = (rulerLength / (ppi / 2.54)).toFixed(2);

    // Update settings controls
    document.getElementById('ruler-width-slider').value = rulerLength;
    document.getElementById('ruler-width-input').value = rulerLength;
    document.getElementById('ruler-lock-checkbox').checked = state.ruler.isLocked;
  }

  // ==========================================
  // CALIBRATION ENGINE
  // ==========================================
  const calibBox = document.getElementById('calibration-target-box');
  const calibSlider = document.getElementById('calibration-width-slider');
  const calibWidthVal = document.getElementById('calibration-width-px-val');

  function updateCalibrationBoxWidthFromPPI() {
    const selectedObj = REF_OBJECTS[state.calibration.selectedObject];
    state.calibration.boxWidthPx = Math.round(selectedObj.inches * state.ppi);
    syncCalibrationUI();
  }

  function syncCalibrationUI() {
    if (!calibBox || !calibSlider || !calibWidthVal) return;

    const selectedObj = REF_OBJECTS[state.calibration.selectedObject];
    
    // Set aspect ratio or display shape based on selected object
    if (state.calibration.selectedObject.includes('diameter')) {
      // Coin: circular shape
      calibBox.classList.add('rounded-full');
      calibBox.style.width = `${state.calibration.boxWidthPx}px`;
      calibBox.style.height = `${state.calibration.boxWidthPx}px`;
    } else {
      // Bill or Card: rectangular
      calibBox.classList.remove('rounded-full');
      calibBox.style.width = `${state.calibration.boxWidthPx}px`;
      
      // Keep real aspect ratio of standard ID-1 card / dollar bill
      let aspectRatio = 1.0;
      if (state.calibration.selectedObject === 'card_width') {
        aspectRatio = REF_OBJECTS.card_height.inches / REF_OBJECTS.card_width.inches;
      } else if (state.calibration.selectedObject === 'card_height') {
        aspectRatio = REF_OBJECTS.card_width.inches / REF_OBJECTS.card_height.inches;
      } else if (state.calibration.selectedObject === 'dollar_width') {
        aspectRatio = 66.30 / 156.10; // ISO dollar height / width ratio
      }
      
      calibBox.style.height = `${Math.round(state.calibration.boxWidthPx * aspectRatio)}px`;
    }

    calibSlider.value = state.calibration.boxWidthPx;
    calibWidthVal.textContent = `${state.calibration.boxWidthPx}px`;

    // Recalculate and show hypothetical PPI in real-time
    const calculatedPPI = state.calibration.boxWidthPx / selectedObj.inches;
    document.getElementById('calibration-realtime-ppi').textContent = calculatedPPI.toFixed(2);
  }

  function applyCalibration() {
    const selectedObj = REF_OBJECTS[state.calibration.selectedObject];
    const newPPI = state.calibration.boxWidthPx / selectedObj.inches;
    savePPI(newPPI);
    showNotification(`Calibration saved successfully: ${newPPI.toFixed(2)} PPI`);
  }

  // ==========================================
  // PROTRACTOR ENGINE (ANGLE FINDER)
  // ==========================================
  const pSg = document.getElementById('protractor-svg');

  function renderProtractor() {
    if (!pSg) return;

    // Get current pivot point
    const cx = state.protractor.pivot.x;
    const cy = state.protractor.pivot.y;
    
    // Set background SVG path
    const pBgCircle = document.getElementById('protractor-bg-circle');
    const pTicksGroup = document.getElementById('protractor-ticks-group');
    const pArm1Line = document.getElementById('protractor-arm1-line');
    const pArm2Line = document.getElementById('protractor-arm2-line');
    const pArm1Handle = document.getElementById('protractor-arm1-handle');
    const pArm2Handle = document.getElementById('protractor-arm2-handle');
    const pPivotHandle = document.getElementById('protractor-pivot-handle');
    const pArcFill = document.getElementById('protractor-arc-fill');

    // 1. Draw central core protractor ring background
    pBgCircle.setAttribute('cx', cx);
    pBgCircle.setAttribute('cy', cy);
    pBgCircle.setAttribute('r', '140');

    // 2. Draw dynamic arms
    pArm1Line.setAttribute('x1', cx);
    pArm1Line.setAttribute('y1', cy);
    pArm1Line.setAttribute('x2', state.protractor.arm1.x);
    pArm1Line.setAttribute('y2', state.protractor.arm1.y);

    pArm2Line.setAttribute('x1', cx);
    pArm2Line.setAttribute('y1', cy);
    pArm2Line.setAttribute('x2', state.protractor.arm2.x);
    pArm2Line.setAttribute('y2', state.protractor.arm2.y);

    // 3. Move handles
    pPivotHandle.setAttribute('transform', `translate(${cx}, ${cy})`);
    pArm1Handle.setAttribute('transform', `translate(${state.protractor.arm1.x}, ${state.protractor.arm1.y})`);
    pArm2Handle.setAttribute('transform', `translate(${state.protractor.arm2.x}, ${state.protractor.arm2.y})`);

    // 4. Generate dial scale ticks dynamically
    pTicksGroup.innerHTML = '';
    const rOuter = 140;
    
    // Draw degree lines
    for (let deg = 0; deg < 360; deg += 1) {
      let rInner = 135;
      let isLabeled = false;

      if (deg % 10 === 0) {
        rInner = 124;
        isLabeled = true;
      } else if (deg % 5 === 0) {
        rInner = 130;
      }

      const rad = (deg * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const x1 = cx + rOuter * cos;
      const y1 = cy + rOuter * sin;
      const x2 = cx + rInner * cos;
      const y2 = cy + rInner * sin;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1.toFixed(2));
      line.setAttribute('y1', y1.toFixed(2));
      line.setAttribute('x2', x2.toFixed(2));
      line.setAttribute('y2', y2.toFixed(2));
      
      if (deg % 10 === 0) {
        line.setAttribute('class', 'stroke-gray-400 dark:stroke-gray-500');
        line.setAttribute('stroke-width', '1');
      } else {
        line.setAttribute('class', 'stroke-gray-300 dark:stroke-gray-700');
        line.setAttribute('stroke-width', '0.7');
      }
      pTicksGroup.appendChild(line);

      // Label positions
      if (isLabeled && deg % 30 === 0) {
        const rLabel = 110;
        const lx = cx + rLabel * cos;
        const ly = cy + rLabel * sin;

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', lx.toFixed(2));
        text.setAttribute('y', (ly + 3.5).toFixed(2));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', 'fill-gray-400 dark:fill-gray-500 text-[9px] font-sans font-medium select-none pointer-events-none');
        text.textContent = deg.toString();
        pTicksGroup.appendChild(text);
      }
    }

    // 5. Calculate Angles
    // Angle relative to screen standard positive X axis (horizontal right)
    const angle1 = Math.atan2(state.protractor.arm1.y - cy, state.protractor.arm1.x - cx);
    const angle2 = Math.atan2(state.protractor.arm2.y - cy, state.protractor.arm2.x - cx);

    let deltaRad = angle2 - angle1;
    // Normalize to 0 to 2*PI
    if (deltaRad < 0) {
      deltaRad += 2 * Math.PI;
    }

    let displayRad = deltaRad;
    let displayDeg = (deltaRad * 180) / Math.PI;

    const reflexMode = state.protractor.showReflex;
    if (!reflexMode && displayDeg > 180) {
      displayDeg = 360 - displayDeg;
      displayRad = 2 * Math.PI - displayRad;
    }

    // Write digital readouts
    document.getElementById('angle-deg').textContent = displayDeg.toFixed(1);
    
    // Pi Radian formatting
    const piFraction = displayRad / Math.PI;
    document.getElementById('angle-rad').textContent = `${displayRad.toFixed(2)} rad`;
    document.getElementById('angle-pi').textContent = `${piFraction.toFixed(2)}π`;

    // 6. Draw Highlight Arc Fill
    // To draw a SVG arc: d="M sx sy A rx ry x-axis-rotation large-arc-flag sweep-flag ex ey"
    const rArc = 60;
    const startX = cx + rArc * Math.cos(angle1);
    const startY = cy + rArc * Math.sin(angle1);
    
    let endAngle = angle2;
    if (!reflexMode && (angle2 - angle1 + 2 * Math.PI) % (2 * Math.PI) > Math.PI) {
      // Draw shorter arc
      endAngle = angle1 + (displayDeg * Math.PI) / 180;
    } else if (reflexMode && (angle2 - angle1 + 2 * Math.PI) % (2 * Math.PI) <= Math.PI) {
      // Draw longer arc
      endAngle = angle1 + (displayDeg * Math.PI) / 180;
    }

    const endX = cx + rArc * Math.cos(endAngle);
    const endY = cy + rArc * Math.sin(endAngle);

    const largeArcFlag = displayDeg > 180 ? 1 : 0;
    // Sweep-flag is 1 for clockwise (SVG coordinates have y down, so standard math counterclockwise is SVG clockwise)
    const sweepFlag = 1;

    if (displayDeg > 0 && displayDeg < 360) {
      pArcFill.setAttribute('d', `M ${startX.toFixed(2)} ${startY.toFixed(2)} A ${rArc} ${rArc} 0 ${largeArcFlag} ${sweepFlag} ${endX.toFixed(2)} ${endY.toFixed(2)} L ${cx} ${cy} Z`);
      pArcFill.setAttribute('opacity', '0.2');
    } else if (displayDeg >= 360) {
      // Draw complete circle
      pArcFill.setAttribute('d', `M ${cx - rArc} ${cy} A ${rArc} ${rArc} 0 1 0 ${cx + rArc} ${cy} A ${rArc} ${rArc} 0 1 0 ${cx - rArc} ${cy} Z`);
      pArcFill.setAttribute('opacity', '0.2');
    } else {
      pArcFill.setAttribute('d', '');
    }
  }

  // ==========================================
  // BIDIRECTIONAL UNIT CONVERTER
  // ==========================================
  function updateConverter(sourceId, value) {
    if (isNaN(value) || value < 0) return;

    const ppi = state.ppi;
    let pxValue = 0;

    // Phase 1: Convert input source value to core Pixel (px) baseline
    switch (sourceId) {
      case 'px':
        pxValue = value;
        break;
      case 'in':
        pxValue = value * ppi;
        break;
      case 'cm':
        pxValue = (value / 2.54) * ppi;
        break;
      case 'mm':
        pxValue = (value / 25.4) * ppi;
        break;
      case 'ft':
        pxValue = value * 12 * ppi;
        break;
      case 'm':
        pxValue = (value * 100 / 2.54) * ppi;
        break;
      case 'pt':
        pxValue = (value / 72) * ppi;
        break;
      case 'em':
      case 'rem':
        pxValue = value * 16; // Standard 16px root layout
        break;
    }

    // Phase 2: Convert Pixel (px) baseline value to all other fields
    const targets = {
      px: pxValue,
      in: pxValue / ppi,
      cm: (pxValue / ppi) * 2.54,
      mm: (pxValue / ppi) * 25.4,
      ft: (pxValue / ppi) / 12,
      m: ((pxValue / ppi) * 2.54) / 100,
      pt: (pxValue / ppi) * 72,
      em: pxValue / 16,
      rem: pxValue / 16,
    };

    // Update all inputs except the active source
    Object.keys(targets).forEach((id) => {
      const inputEl = document.getElementById(`conv-${id}`);
      if (inputEl && id !== sourceId) {
        // Format to maximum 4 decimals, slicing unnecessary trailing decimals
        const valStr = targets[id].toFixed(4);
        inputEl.value = parseFloat(valStr); // Removes trailing zeros automatically
      }
    });
  }

  // ==========================================
  // EVENT LISTENERS & DELEGATION
  // ==========================================
  function setupEventListeners() {
    // ------------------------------------------
    // Theme Mode Toggle
    // ------------------------------------------
    document.getElementById('theme-toggle').addEventListener('click', () => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      applyTheme();
      syncThemeToggleUI();
      renderRuler(); // Re-render to load appropriate high contrast ticks
    });

    // ------------------------------------------
    // Ruler Drag & Positioning (Mouse/Touch)
    // ------------------------------------------
    let dragOffset = { x: 0, y: 0 };
    let isDraggingRuler = false;

    rulerEl.addEventListener('mousedown', (e) => {
      // Guard against lock state or clicking sliders/inputs/handles
      if (state.ruler.isLocked || e.target.closest('.ruler-handle') || e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
      
      isDraggingRuler = true;
      dragOffset.x = e.clientX - state.ruler.x;
      dragOffset.y = e.clientY - state.ruler.y;
      rulerEl.classList.add('cursor-grabbing', 'shadow-2xl');
      rulerEl.classList.remove('cursor-grab');
    });

    rulerEl.addEventListener('touchstart', (e) => {
      if (state.ruler.isLocked || e.target.closest('.ruler-handle') || e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
      
      isDraggingRuler = true;
      const touch = e.touches[0];
      dragOffset.x = touch.clientX - state.ruler.x;
      dragOffset.y = touch.clientY - state.ruler.y;
    }, { passive: true });

    // ------------------------------------------
    // Ruler Resize Handles (Horizontal/Vertical)
    // ------------------------------------------
    let isResizingRuler = false;
    let startLength = 0;
    let startMousePos = 0;

    const endHandle = document.getElementById('ruler-resize-handle');
    endHandle.addEventListener('mousedown', (e) => {
      if (state.ruler.isLocked) return;
      e.stopPropagation();
      e.preventDefault();
      isResizingRuler = true;
      startLength = state.ruler.widthPx;
      startMousePos = state.ruler.isVertical ? e.clientY : e.clientX;
    });

    endHandle.addEventListener('touchstart', (e) => {
      if (state.ruler.isLocked) return;
      e.stopPropagation();
      isResizingRuler = true;
      startLength = state.ruler.widthPx;
      const touch = e.touches[0];
      startMousePos = state.ruler.isVertical ? touch.clientY : touch.clientX;
    }, { passive: true });

    // ------------------------------------------
    // Global Move & Release Listeners (Mouse & Touch)
    // ------------------------------------------
    window.addEventListener('mousemove', (e) => {
      if (isDraggingRuler) {
        state.ruler.x = e.clientX - dragOffset.x;
        state.ruler.y = e.clientY - dragOffset.y;
        
        // Keep ruler in a boundary (clamping within screen slightly)
        state.ruler.x = Math.max(-50, Math.min(window.innerWidth - 50, state.ruler.x));
        state.ruler.y = Math.max(-50, Math.min(window.innerHeight - 50, state.ruler.y));

        rulerEl.style.left = `${state.ruler.x}px`;
        rulerEl.style.top = `${state.ruler.y}px`;
      }

      if (isResizingRuler) {
        const currentMousePos = state.ruler.isVertical ? e.clientY : e.clientX;
        const delta = currentMousePos - startMousePos;
        state.ruler.widthPx = Math.max(100, Math.min(4000, startLength + delta));
        renderRuler();
      }

      if (state.protractor.activeHandle) {
        handleProtractorDrag(e.clientX, e.clientY);
      }
    });

    window.addEventListener('touchmove', (e) => {
      if (isDraggingRuler && e.touches.length > 0) {
        const touch = e.touches[0];
        state.ruler.x = touch.clientX - dragOffset.x;
        state.ruler.y = touch.clientY - dragOffset.y;

        state.ruler.x = Math.max(-50, Math.min(window.innerWidth - 50, state.ruler.x));
        state.ruler.y = Math.max(-50, Math.min(window.innerHeight - 50, state.ruler.y));

        rulerEl.style.left = `${state.ruler.x}px`;
        rulerEl.style.top = `${state.ruler.y}px`;
      }

      if (isResizingRuler && e.touches.length > 0) {
        const touch = e.touches[0];
        const currentMousePos = state.ruler.isVertical ? touch.clientY : touch.clientX;
        const delta = currentMousePos - startMousePos;
        state.ruler.widthPx = Math.max(100, Math.min(4000, startLength + delta));
        renderRuler();
      }

      if (state.protractor.activeHandle && e.touches.length > 0) {
        const touch = e.touches[0];
        handleProtractorDrag(touch.clientX, touch.clientY);
      }
    }, { passive: true });

    window.addEventListener('mouseup', () => {
      if (isDraggingRuler) {
        isDraggingRuler = false;
        rulerEl.classList.remove('cursor-grabbing', 'shadow-2xl');
        rulerEl.classList.add('cursor-grab');
        localStorage.setItem('sro_ruler_settings', JSON.stringify({
          x: state.ruler.x,
          y: state.ruler.y,
          widthPx: state.ruler.widthPx,
          isVertical: state.ruler.isVertical,
        }));
      }

      if (isResizingRuler) {
        isResizingRuler = false;
        localStorage.setItem('sro_ruler_settings', JSON.stringify({
          x: state.ruler.x,
          y: state.ruler.y,
          widthPx: state.ruler.widthPx,
          isVertical: state.ruler.isVertical,
        }));
      }

      if (state.protractor.activeHandle) {
        state.protractor.activeHandle = null;
      }
    });

    window.addEventListener('touchend', () => {
      if (isDraggingRuler) {
        isDraggingRuler = false;
        localStorage.setItem('sro_ruler_settings', JSON.stringify({
          x: state.ruler.x,
          y: state.ruler.y,
          widthPx: state.ruler.widthPx,
          isVertical: state.ruler.isVertical,
        }));
      }
      if (isResizingRuler) {
        isResizingRuler = false;
        localStorage.setItem('sro_ruler_settings', JSON.stringify({
          x: state.ruler.x,
          y: state.ruler.y,
          widthPx: state.ruler.widthPx,
          isVertical: state.ruler.isVertical,
        }));
      }
      state.protractor.activeHandle = null;
    });

    // ------------------------------------------
    // Ruler Workspace Settings Form Controls
    // ------------------------------------------
    document.getElementById('ruler-rotate-btn').addEventListener('click', () => {
      state.ruler.isVertical = !state.ruler.isVertical;
      renderRuler();
      // Rotate end handles visually
      const resizeIcon = document.getElementById('resize-icon');
      if (state.ruler.isVertical) {
        resizeIcon.classList.add('rotate-90');
      } else {
        resizeIcon.classList.remove('rotate-90');
      }
    });

    const rWidthSlider = document.getElementById('ruler-width-slider');
    const rWidthInput = document.getElementById('ruler-width-input');

    rWidthSlider.addEventListener('input', (e) => {
      state.ruler.widthPx = parseInt(e.target.value);
      renderRuler();
    });

    rWidthInput.addEventListener('input', (e) => {
      let val = parseInt(e.target.value);
      if (isNaN(val) || val < 100) val = 100;
      if (val > 4000) val = 4000;
      state.ruler.widthPx = val;
      renderRuler();
    });

    document.getElementById('ruler-lock-checkbox').addEventListener('change', (e) => {
      state.ruler.isLocked = e.target.checked;
      renderRuler();
    });

    // Color Pickers
    document.querySelectorAll('.ruler-color-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        state.ruler.color = e.currentTarget.dataset.color;
        renderRuler();
      });
    });

    document.getElementById('reset-ruler-btn').addEventListener('click', () => {
      state.ruler.x = 100;
      state.ruler.y = 150;
      state.ruler.widthPx = 800;
      state.ruler.isVertical = false;
      renderRuler();
      showNotification('Ruler position and dimensions reset.');
    });

    // ------------------------------------------
    // Calibrator Controls
    // ------------------------------------------
    // Selection Cards
    document.querySelectorAll('.calib-obj-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        // Remove active rings
        document.querySelectorAll('.calib-obj-card').forEach((c) => c.classList.remove('ring-4', 'ring-sky-500', 'bg-sky-50', 'dark:bg-sky-950/20'));
        e.currentTarget.classList.add('ring-4', 'ring-sky-500', 'bg-sky-50', 'dark:bg-sky-950/20');
        
        state.calibration.selectedObject = e.currentTarget.dataset.key;
        updateCalibrationBoxWidthFromPPI();
      });
    });

    // Calib Drag resizing
    let isResizingCalibBox = false;
    let startCalibWidth = 0;
    let startCalibMouseX = 0;
    const calibResizeHandle = document.getElementById('calibration-resize-handle');

    calibResizeHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      isResizingCalibBox = true;
      startCalibWidth = state.calibration.boxWidthPx;
      startCalibMouseX = e.clientX;
    });

    calibResizeHandle.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      isResizingCalibBox = true;
      startCalibWidth = state.calibration.boxWidthPx;
      startCalibMouseX = e.touches[0].clientX;
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      if (isResizingCalibBox) {
        const delta = e.clientX - startCalibMouseX;
        state.calibration.boxWidthPx = Math.max(50, Math.min(2000, startCalibWidth + delta * 2)); // Multiplying by 2 because center aligned
        syncCalibrationUI();
      }
    });

    window.addEventListener('touchmove', (e) => {
      if (isResizingCalibBox && e.touches.length > 0) {
        const delta = e.touches[0].clientX - startCalibMouseX;
        state.calibration.boxWidthPx = Math.max(50, Math.min(2000, startCalibWidth + delta * 2));
        syncCalibrationUI();
      }
    }, { passive: true });

    window.addEventListener('mouseup', () => {
      isResizingCalibBox = false;
    });
    window.addEventListener('touchend', () => {
      isResizingCalibBox = false;
    });

    // Calibration Slider
    calibSlider.addEventListener('input', (e) => {
      state.calibration.boxWidthPx = parseInt(e.target.value);
      syncCalibrationUI();
    });

    // Button fine-tuning
    document.getElementById('calib-dec-btn').addEventListener('click', () => {
      state.calibration.boxWidthPx = Math.max(50, state.calibration.boxWidthPx - 1);
      syncCalibrationUI();
    });
    document.getElementById('calib-inc-btn').addEventListener('click', () => {
      state.calibration.boxWidthPx = Math.min(2000, state.calibration.boxWidthPx + 1);
      syncCalibrationUI();
    });

    // Apply Button
    document.getElementById('apply-calibration-btn').addEventListener('click', () => {
      applyCalibration();
    });

    // Manual PPI Input
    document.getElementById('manual-ppi-input').addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val > 0 && val < 500) {
        savePPI(val);
        updateCalibrationBoxWidthFromPPI();
      }
    });

    // Manual PPI fine-tuning
    document.getElementById('manual-ppi-dec').addEventListener('click', () => {
      savePPI(Math.max(10, state.ppi - 1));
      updateCalibrationBoxWidthFromPPI();
    });
    document.getElementById('manual-ppi-inc').addEventListener('click', () => {
      savePPI(Math.min(500, state.ppi + 1));
      updateCalibrationBoxWidthFromPPI();
    });

    // Reset To Default Button
    document.getElementById('reset-ppi-btn').addEventListener('click', () => {
      savePPI(96);
      updateCalibrationBoxWidthFromPPI();
      showNotification('PPI reset to standard default: 96 PPI.');
    });

    // ------------------------------------------
    // Protractor (SVG Node Drag) Listeners
    // ------------------------------------------
    const hPivot = document.getElementById('protractor-pivot-handle');
    const hArm1 = document.getElementById('protractor-arm1-handle');
    const hArm2 = document.getElementById('protractor-arm2-handle');

    hPivot.addEventListener('mousedown', (e) => { e.stopPropagation(); state.protractor.activeHandle = 'pivot'; });
    hPivot.addEventListener('touchstart', (e) => { e.stopPropagation(); state.protractor.activeHandle = 'pivot'; }, { passive: true });

    hArm1.addEventListener('mousedown', (e) => { e.stopPropagation(); state.protractor.activeHandle = 'arm1'; });
    hArm1.addEventListener('touchstart', (e) => { e.stopPropagation(); state.protractor.activeHandle = 'arm1'; }, { passive: true });

    hArm2.addEventListener('mousedown', (e) => { e.stopPropagation(); state.protractor.activeHandle = 'arm2'; });
    hArm2.addEventListener('touchstart', (e) => { e.stopPropagation(); state.protractor.activeHandle = 'arm2'; }, { passive: true });

    // Reflex angle toggle
    document.getElementById('protractor-reflex-toggle').addEventListener('change', (e) => {
      state.protractor.showReflex = e.target.checked;
      renderProtractor();
    });

    // Protractor keyboard adjustments (Accessibility focus tags)
    setupHandleAccessibility(hPivot, 'pivot');
    setupHandleAccessibility(hArm1, 'arm1');
    setupHandleAccessibility(hArm2, 'arm2');

    // ------------------------------------------
    // Bidirectional Unit Converter Listeners
    // ------------------------------------------
    const convInputs = ['px', 'in', 'cm', 'mm', 'ft', 'm', 'pt', 'em', 'rem'];
    convInputs.forEach((id) => {
      const inputEl = document.getElementById(`conv-${id}`);
      if (inputEl) {
        inputEl.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          updateConverter(id, val);
        });
      }
    });

    // Quick fill helper conversions buttons
    document.querySelectorAll('.quick-conv-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const val = parseFloat(e.currentTarget.dataset.value);
        const unit = e.currentTarget.dataset.unit;
        const inputEl = document.getElementById(`conv-${unit}`);
        if (inputEl) {
          inputEl.value = val;
          updateConverter(unit, val);
        }
      });
    });
  }

  // Handle active protractor handle positioning
  function handleProtractorDrag(clientX, clientY) {
    const svgRect = pSg.getBoundingClientRect();
    // Convert client screen coordinates to local SVG viewBox coordinates
    const scaleX = 600 / svgRect.width;
    const scaleY = 400 / svgRect.height;
    
    const localX = (clientX - svgRect.left) * scaleX;
    const localY = (clientY - svgRect.top) * scaleY;

    const hType = state.protractor.activeHandle;
    const cx = state.protractor.pivot.x;
    const cy = state.protractor.pivot.y;

    if (hType === 'pivot') {
      const dx = localX - cx;
      const dy = localY - cy;
      
      // Shift arms accordingly alongside pivot shift to maintain arm angles and lengths
      state.protractor.pivot.x = localX;
      state.protractor.pivot.y = localY;

      state.protractor.arm1.x += dx;
      state.protractor.arm1.y += dy;

      state.protractor.arm2.x += dx;
      state.protractor.arm2.y += dy;
    } else if (hType === 'arm1') {
      // Rotate Arm 1 while locking length to exactly 150px
      const angle = Math.atan2(localY - cy, localX - cx);
      state.protractor.arm1.x = cx + 150 * Math.cos(angle);
      state.protractor.arm1.y = cy + 150 * Math.sin(angle);
    } else if (hType === 'arm2') {
      // Rotate Arm 2 while locking length to exactly 150px
      const angle = Math.atan2(localY - cy, localX - cx);
      state.protractor.arm2.x = cx + 150 * Math.cos(angle);
      state.protractor.arm2.y = cy + 150 * Math.sin(angle);
    }

    // Keep handles clamped to boundaries
    clampProtractorNodes();
    renderProtractor();
  }

  function clampProtractorNodes() {
    // Keep pivot inside 600x400 canvas safely
    state.protractor.pivot.x = Math.max(50, Math.min(550, state.protractor.pivot.x));
    state.protractor.pivot.y = Math.max(50, Math.min(350, state.protractor.pivot.y));
  }

  // ------------------------------------------
  // KEYBOARD ACCESSIBILITY FINE-TUNING
  // ------------------------------------------
  function setupHandleAccessibility(el, handleType) {
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'slider');
    el.setAttribute('aria-label', `Adjust Protractor ${handleType}`);

    el.addEventListener('keydown', (e) => {
      let dx = 0;
      let dy = 0;
      const step = e.shiftKey ? 10 : 1;

      if (e.key === 'ArrowLeft' || e.key === 'Left') {
        dx = -step;
      } else if (e.key === 'ArrowRight' || e.key === 'Right') {
        dx = step;
      } else if (e.key === 'ArrowUp' || e.key === 'Up') {
        dy = -step;
      } else if (e.key === 'ArrowDown' || e.key === 'Down') {
        dy = step;
      } else {
        return; // Ignore non-directional keys
      }

      e.preventDefault();

      const cx = state.protractor.pivot.x;
      const cy = state.protractor.pivot.y;

      if (handleType === 'pivot') {
        state.protractor.pivot.x += dx;
        state.protractor.pivot.y += dy;
        state.protractor.arm1.x += dx;
        state.protractor.arm1.y += dy;
        state.protractor.arm2.x += dx;
        state.protractor.arm2.y += dy;
      } else if (handleType === 'arm1') {
        // Move arm target directly via cartesian shifting and normalize vector to length 150
        const currentX = state.protractor.arm1.x + dx;
        const currentY = state.protractor.arm1.y + dy;
        const angle = Math.atan2(currentY - cy, currentX - cx);
        state.protractor.arm1.x = cx + 150 * Math.cos(angle);
        state.protractor.arm1.y = cy + 150 * Math.sin(angle);
      } else if (handleType === 'arm2') {
        const currentX = state.protractor.arm2.x + dx;
        const currentY = state.protractor.arm2.y + dy;
        const angle = Math.atan2(currentY - cy, currentX - cx);
        state.protractor.arm2.x = cx + 150 * Math.cos(angle);
        state.protractor.arm2.y = cy + 150 * Math.sin(angle);
      }

      clampProtractorNodes();
      renderProtractor();
    });
  }

  // Accessibility keyboard focus for Ruler using keydown window capture
  window.addEventListener('keydown', (e) => {
    // If user is focused inside input elements, don't capture typing as ruler movement
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

    if (state.ruler.isLocked) return;

    let dx = 0;
    let dy = 0;
    const step = e.shiftKey ? 10 : 1;

    if (e.key === 'ArrowLeft' || e.key === 'Left') {
      dx = -step;
    } else if (e.key === 'ArrowRight' || e.key === 'Right') {
      dx = step;
    } else if (e.key === 'ArrowUp' || e.key === 'Up') {
      dy = -step;
    } else if (e.key === 'ArrowDown' || e.key === 'Down') {
      dy = step;
    } else {
      return;
    }

    e.preventDefault();
    state.ruler.x += dx;
    state.ruler.y += dy;
    rulerEl.style.left = `${state.ruler.x}px`;
    rulerEl.style.top = `${state.ruler.y}px`;
  });

  // Init App Bootstrap
  initApp();
});
