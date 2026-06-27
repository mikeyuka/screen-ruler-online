# Product Requirements Document (PRD)
## Rebirth of "Screen Ruler Online" (SRO) — High-Performance Measurement Suite

---

### Document Metadata
- **Status**: Draft (Ready for Engineering & Design Review)
- **Author**: Product Manager
- **Version**: 1.0.0
- **Target Release**: Q3 2026
- **Architecture Principle**: 100% Client-Side Static (HTML5, Tailwind CSS, Vanilla JS)
- **Hosting Strategy**: Zero-cost Edge Static Hosting (Vercel / GitHub Pages / Netlify) + Cloudflare CDN

---

## 1. Executive Summary & Vision

### 1.1 Objective
The purpose of this project is to build a modern, lightning-fast, and highly accurate **"Screen Ruler Online" (SRO)** web application. This tool is designed to replace outdated, ad-cluttered, and slow-loading screen rulers currently dominating search engine results. SRO will be engineered as a pure-client static application, ensuring zero server maintenance costs, absolute data privacy (no data leaves the user's browser), and instant loading speeds (under 200ms TTI).

### 1.2 Core Value Proposition
- **Mathematically Accurate**: Instant calibration to physical screens using standard objects, bypassing the default browser assumption of 96 PPI.
- **High-Performance**: Pure Vanilla JS, zero dependencies, no heavy CSS frameworks (excluding lightweight utility-first Tailwind CSS), yielding an ultra-light page bundle (<50KB total transfer size).
- **Zero Cost & Infinite Scalability**: Pure client-side static hosting, enabling free scaling to millions of monthly active users.
- **Search Engine Optimized (SEO)**: Tailored specifically to capture the dominant desktop search volume (historically 70%+ on Bing for these utility terms) as well as Google rankings.

---

## 2. Target Audience & Market Analysis

### 2.1 Persona Breakdown

#### Persona A: The Front-End Developer & UI Designer ("Sarah")
- **Needs**: Sarah needs to verify spacing, padding, margins, alignment, and element dimensions on live browser windows without launching complex dev tools or taking screenshots into Photoshop/Figma.
- **Pain Points**: Resizing windows breaks layout overlays; extensions require installation and permissions; legacy ruler websites are covered in intrusive advertisements and pop-ups that break her concentration.

#### Persona B: The E-Commerce Shopper ("David")
- **Needs**: David wants to buy a physical ring, a watch, screws, or small electronic components online. He needs a quick physical ruler to place a physical object against the screen or measure something in hand.
- **Pain Points**: Default screen rulers are physically inaccurate because his 4K monitor has a much higher pixels-per-inch (PPI) density than a standard 1080p display, making a standard pixel-based ruler physically smaller or larger than an actual inch/cm.

#### Persona C: The Hobbyist & 3D Printing Enthusiast ("Alex")
- **Needs**: Alex needs to quickly measure physical parts or check diameters of items on-the-fly using their tablet or laptop.
- **Pain Points**: No calipers on hand, and downloading mobile apps requires account creation and yields inaccurate results without proper visual calibration tools.

### 2.2 Core Market Opportunity & Channel Selection
Analysis of keyword volume shows that "Screen Ruler Online", "Online Ruler", "Web Ruler", and related queries have high desktop search volumes. Crucially, **Bing controls roughly 70% of traffic in this utility niche**. This is because desktop-based professionals and office workers frequently use default Windows browsers (Microsoft Edge) and corporate networks where Bing is the default search engine. SRO will specifically optimize its crawling profile and technical performance to dominate Bing Search rankings alongside Google.

---

## 3. Product Scope & MoSCoW Prioritization

To launch a highly competitive MVP that immediately outclasses existing competitors, SRO will focus on high-utility features with zero feature bloat:

| Feature / Tool | Priority (MoSCoW) | Description |
| :--- | :--- | :--- |
| **Precise Screen Ruler (Inches & CM)** | **Must-Have (M)** | Fully draggable, responsive, and scalable vertical/horizontal physical rules. |
| **Interactive Screen Calibrator** | **Must-Have (M)** | Calibrates screen pixels to physical dimensions using 4 reference objects or manual entry. |
| **Length & Screen Unit Converter** | **Must-Have (M)** | Bidirectional physical-to-screen conversion tool synced with calibrated PPI. |
| **Offline-First Support** | **Must-Have (M)** | Local caching via Service Workers so SRO works entirely without an internet connection once loaded. |
| **Interactive Protractor (Angle Finder)** | **Should-Have (S)** | Interactive SVG/Canvas protractor with rotating arms to measure on-screen angles. |
| **Keyboard Fine-Tuning** | **Should-Have (S)** | Use of arrow keys (with `Shift` modifier for larger increments) to fine-tune measurements. |
| **State Persistence** | **Should-Have (S)** | Auto-saving PPI calibration, theme preferences, and configurations in `localStorage`. |
| **Dark / Light Mode Toggle** | **Should-Have (S)** | Complete theme adaptation with automatic system theme preference detection. |
| **Screen Overlay / Measurement Guides** | **Could-Have (C)** | Horizontal/vertical crosshairs/guidelines that can be dropped onto the browser tab. |
| **Multi-Language Support** | **Could-Have (C)** | Static translation files for French, German, Spanish, Japanese, Chinese, and Korean. |
| **In-App Screenshot / Visual Overlay** | **Won't-Have (W)** | Capturing external desktop screens (restricted due to browser sandbox security policies). |

---

## 4. Technical Architecture & Tech Stack

To achieve maximum performance, perfect SEO, and zero hosting costs, SRO enforces a strict static-only architectural philosophy:

```
+---------------------------------------------------------------------------------+
|                                 CLOUDFLARE CDN                                  |
|         - Global Edge Caching | SSL/TLS Encryption | HTTP/3 Protocol Support     |
+---------------------------------------------------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
|                           STATIC hosting providers                              |
|           (Vercel Edge / Netlify / GitHub Pages - Static Assets Only)           |
+---------------------------------------------------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
|                           CLIENT-SIDE APPLICATION (BROWSER)                     |
|                                                                                 |
|   +-----------------------+   +------------------------+   +----------------+   |
|   |        HTML5          |   |     Tailwind CSS       |   |   Vanilla JS   |   |
|   |  (Semantic Structure) |   |  (Utility Styles, JIT) |   |  (State, DOM)  |   |
|   +-----------------------+   +------------------------+   +----------------+   |
|                                                                                 |
|   +------------------------+  +------------------------+  +-----------------+   |
|   |     Service Worker     |  |      LocalStorage      |  |  SVG Protractor |   |
|   |  (Offline App Caching) |  |   (Calibrated State)   |  |  & Dynamic Rule |   |
|   +------------------------+  +------------------------+  +-----------------+   |
+---------------------------------------------------------------------------------+
```

### 4.1 Technology Stack Justification
1. **Frontend Core**: HTML5 + Tailwind CSS + Vanilla JS (ES6+).
   - **No Framework Overhead**: Traditional single-page application (SPA) frameworks (React, Angular, Vue) inject heavy Javascript bundle sizes, increasing hydration delay. SRO bypasses this entirely to guarantee sub-200ms loading speeds.
   - **No Outdated Dependencies**: Zero jQuery, zero Bootstrap. All interactions are handled via native browser DOM APIs and modern CSS properties.
   - **Tailwind CSS Utility Philosophy**: Used for styling to ensure rapid responsive prototyping and tiny pre-compiled production CSS (using Tailwind JIT compiler to purge unused classes, bringing stylesheet sizes to under 10KB).
2. **Hosting Infrastructure**: Static CDN Hosting.
   - **Platforms**: GitHub Pages, Vercel, or Netlify.
   - **Edge Proxy**: Cloudflare CDN acting as the DNS proxy.
   - **Why?**: Serves all assets directly from Edge servers closest to the user. Results in close-to-zero Time to First Byte (TTFB). Since there is no server execution layer, the monthly cost of hosting is **exactly $0.00**, and the site is immune to traffic spikes (e.g., Slashdot effect, viral Reddit sharing).

### 4.2 Core Web Vitals (Performance Benchmarks)
The application must adhere to the following performance SLAs:
- **Largest Contentful Paint (LCP)**: `< 500ms` on desktop, `< 1.0s` on mobile (3G Slow).
- **First Input Delay (FID)**: `< 20ms`.
- **Cumulative Layout Shift (CLS)**: `0.00` (All sizes are structurally reserved).
- **Time to Interactive (TTI)**: `< 300ms`.
- **Lighthouse Performance, SEO, Best Practices, and Accessibility Scores**: `100/100` target across all audits.

---

## 5. Detailed Product Specifications

### 5.1 Core Tool: Precise Screen Ruler (Inches & CM)

The Core Ruler acts as the primary visual asset on the SRO homepage. It must be physically accurate, responsive, and highly interactive.

#### 5.1.1 Visual & UX Requirements
- **Double-Sided Ruler**:
  - The top edge displays **Centimeters & Millimeters** (Metric system).
  - The bottom edge displays **Inches** (Imperial system, split into 1/2, 1/4, 1/8, and 1/16ths).
- **Dual-Orientation Toggles**: Users can toggle the ruler between **Horizontal** (default) and **Vertical** orientations.
- **Draggable & Positioning Mechanics**:
  - The ruler is a floating, draggable window component.
  - Interactive grab handles are placed at both ends for easy positioning.
  - Clicking anywhere on the ruler body (excluding specific controls) lets the user drag the ruler across their desktop viewport.
- **Dynamic Resizing**: Draggable endpoints permit the user to stretch or shrink the physical ruler length on-screen.
- **Visual Scale Markers**:
  - Millimeter ticks: High-contrast lines of varying heights (e.g., 5mm is medium-tall, 10mm is tallest with numerical labels).
  - Inch ticks: Standard fractional line heights (1/2" is tallest, 1/4" is medium, 1/8" is short, 1/16" is shortest) with numerical labels.

#### 5.1.2 Functional & State Logic
- **Scaling Formula**: Rulers are rendered dynamically using SVG elements inside HTML. To render physical inches/cm accurately, SRO uses a calibrated PPI value (default fallback is `96` pixels per inch).
- To draw $1\text{ inch}$ on the screen:
  $$\text{Width of } 1\text{ in (px)} = \text{Calibrated PPI}$$
- To draw $1\text{ cm}$ on the screen:
  $$\text{Width of } 1\text{ cm (px)} = \frac{\text{Calibrated PPI}}{2.54}$$
- To draw $1\text{ mm}$ on the screen:
  $$\text{Width of } 1\text{ mm (px)} = \frac{\text{Calibrated PPI}}{25.4}$$
- The SVG must dynamically recalculate ticks whenever the core `calibrated_ppi` state changes.

---

### 5.2 Tool 1: Interactive Screen Calibrator

Because devices have varying pixel densities (e.g., Apple Retina displays vs. standard Dell 1080p monitors), SRO requires an intuitive and precise calibration mechanism.

#### 5.2.1 Reference Objects Specifications
The calibrator will render a physical outline representing a chosen standard object. Users can place the physical object on their screen and resize the on-screen box until it matches the physical object perfectly. SRO supports 4 highly accessible reference objects:

1. **Standard Credit Card / ID (ISO/IEC 7810 ID-1)**:
   - **Physical Width**: $85.60\text{ mm}$ ($3.370\text{ inches}$)
   - **Physical Height**: $53.98\text{ mm}$ ($2.125\text{ inches}$)
2. **US Dollar Bill (\$1)**:
   - **Physical Width**: $156.10\text{ mm}$ ($6.140\text{ inches}$)
   - **Physical Height**: $66.30\text{ mm}$ ($2.610\text{ inches}$)
3. **Standard US Quarter (Coin)**:
   - **Physical Diameter**: $24.26\text{ mm}$ ($0.955\text{ inches}$)
4. **Standard Euro (€1 Coin)**:
   - **Physical Diameter**: $23.25\text{ mm}$ ($0.915\text{ inches}$)
5. **Standard UK Pound (£1 Coin)**:
   - **Physical Diameter**: $23.43\text{ mm}$ ($0.922\text{ inches}$)

#### 5.2.2 Interactive UX Design
- **Selector Tabs**: Users select their reference object from an intuitive grid containing icons of a Credit Card, Dollar Bill, and Coins.
- **On-Screen Alignment Box**:
  - A visually clean bounding box (semi-transparent container with a dashed border) is rendered in the center of the viewport.
  - A responsive slider controls the width of the bounding box.
  - Left and Right directional arrows, plus a pinch-to-zoom container, allow fine-tuning.
- **Dynamic PPI Calculation Engine**:
  - Let $W_{\text{ref\_in}}$ be the physical width of the selected reference object in inches.
  - Let $W_{\text{box\_px}}$ be the current width of the on-screen box adjusted by the user in pixels.
  - The active PPI is calculated instantaneously as:
    $$\text{Calibrated PPI} = \frac{W_{\text{box\_px}}}{W_{\text{ref\_in}}}$$
- **Manual Override Mode**:
  - Users who know their monitor spec sheet can bypass visual calibration by typing their PPI directly into a number input field (e.g., `141` for a 13-inch Macbook Air).
  - The UI instantly recalculates all rulers and converters upon text input.
- **State Persistence**:
  - The moment calibration is updated, the new PPI is saved in the background:
    ```javascript
    localStorage.setItem('sro_calibrated_ppi', calibrated_ppi);
    ```
  - Upon returning to the site, SRO reads this value automatically, greeting the user with a notification: `"Calibrated PPI loaded: [X] PPI"`.

---

### 5.3 Tool 2: Interactive Protractor (Angle Finder)

This tool provides an elegant, interactive SVG protractor overlaid on the screen, useful for math students, engineers, and digital artists.

```
       Visual SVG Protractor Schema (Arc & Arms)
                     90° (π/2)
                     _.._
                  .'  |   '.
                .'    |     '.
               /      |       \
       180°   |-------+--------|   0° (0 rad)
      (π rad)  \      |       /
                '.    |     .'
                  '. _|_ _.'
                     270° (3π/2)
                      
                /             \
               /               \
         Arm 1 [Pivot Center]   Arm 2 [Dynamic Rotator Angle θ]
         (Fixed base line)      (Click & drag tip)
```

#### 5.3.1 Visual & Drag Mechanics
- **Geometric Canvas**: Rendered using a crisp, hardware-accelerated SVG container.
- **Components**:
  - **Center Pivot Point**: Draggable target representing the vertex of the angle $(X_c, Y_c)$.
  - **Base Arm (Arm 1)**: Rotatable arm establishing the $0$-degree reference line.
  - **Measuring Arm (Arm 2)**: The active rotating arm.
- **Interactive Nodes**:
  - Standard circular handles (`<circle>` elements with cursor indicators `cursor-pointer / select-none`) sit at the tip of Arm 1 and Arm 2.
  - Touch-friendly sizing: Handles have a minimum target diameter of $44\text{px}$ to accommodate mobile users.
- **Angle Display Box**:
  - Placed at the top-center of the protractor tool.
  - Displays the measured angle in **Degrees** ($0.0^\circ$ to $360.0^\circ$ with $0.1^\circ$ precision) and **Radians** (with up to two decimal places, e.g., `1.57 rad` accompanied by a math-equivalent fraction of $\pi$, e.g., `0.50π`).

#### 5.3.2 Functional Math Logic
- Let the pivot coordinate be $P(x_c, y_c)$, the tip of the Base Arm be $A(x_1, y_1)$, and the tip of the Measuring Arm be $B(x_2, y_2)$.
- The angles of both arms relative to the horizontal screen axis are calculated using `Math.atan2`:
  $$\theta_1 = \text{atan2}(y_1 - y_c, x_1 - x_c)$$
  $$\theta_2 = \text{atan2}(y_2 - y_c, x_2 - x_c)$$
- The absolute internal angle $\Delta \theta$ is derived as:
  $$\Delta \theta = |\theta_2 - \theta_1|$$
  - If $\Delta \theta > \pi$, the tool should automatically display both the inner acute/obtuse angle and the outer reflex angle, with a toggle labeled `"Display Reflex Angle"`.
- **Unit Conversions**:
  - **Radians**:
    $$\text{Radians} = \Delta \theta$$
  - **Degrees**:
    $$\text{Degrees} = \Delta \theta \times \left(\frac{180}{\pi}\right)$$
  - **Pi Representation**:
    $$\text{Pi-Rad Value} = \frac{\Delta \theta}{\pi} \quad (\text{e.g., } 0.33\pi)$$

---

### 5.4 Tool 3: Length & Screen Unit Converter

The Converter serves as a highly functional, reactive grid of numeric inputs. Changing any value instantly calculates and populates all other inputs, facilitating design and engineering tasks.

#### 5.4.1 Bidirectional Conversion Grid
The converter displays a grid divided into two main categories:

##### Category 1: Physical Units
- **Inches (`in`)**
- **Centimeters (`cm`)**
- **Millimeters (`mm`)**
- **Feet (`ft`)**
- **Meters (`m`)**

##### Category 2: Screen/Digital Units
- **Pixels (`px`)**
- **Points (`pt`)**
- **CSS `em`** (relative to parent, assume standard browser default of $16\text{px}$)
- **CSS `rem`** (relative to HTML root, default $16\text{px}$)

#### 5.4.2 Mathematical Formulas (Synced to Calibrated PPI)
Let $P$ be the active, calibrated pixels-per-inch (PPI) of the user's screen. The standard pixel value (`px`) serves as SRO's internal baseline unit. All inputs convert their values back to `px` first, then distribute the recalculated values to the remaining fields:

1. **If user enters standard Pixels ($V_{\text{px}}$)**:
   - **Inches**:
     $$V_{\text{in}} = \frac{V_{\text{px}}}{P}$$
   - **Centimeters**:
     $$V_{\text{cm}} = V_{\text{in}} \times 2.54$$
   - **Millimeters**:
     $$V_{\text{mm}} = V_{\text{in}} \times 25.4$$
   - **Feet**:
     $$V_{\text{ft}} = \frac{V_{\text{in}}}{12}$$
   - **Meters**:
     $$V_{\text{m}} = \frac{V_{\text{cm}}}{100}$$
   - **Points**:
     $$V_{\text{pt}} = V_{\text{in}} \times 72$$
   - **em / rem**:
     $$V_{\text{rem}} = \frac{V_{\text{px}}}{16}$$

2. **If user enters a Physical Unit (e.g., Centimeters $V_{\text{cm}}$)**:
   - SRO first resolves Pixels:
     $$V_{\text{px}} = \left(\frac{V_{\text{cm}}}{2.54}\right) \times P$$
   - It then updates all other physical and digital input elements using the baseline equations.

3. **Validation & Edge Cases**:
   - Limit input fields to non-negative numbers.
   - Guard against $0$ or undefined PPI states by falling back to standard CSS PPI of $96$.
   - Format outputs to a clean 4-decimal-place limit, purging trailing zeros (e.g., `2.5000` is displayed as `2.5`).

---

## 6. SEO, Bing Dominance, & Metadata Requirements

### 6.1 Understanding SRO's Traffic Dynamics
As noted in Section 2.2, screen ruler utilities attract substantial organic search traffic from desktop users. Historically, **Bing has driven over 70% of high-intent search clicks for these utilities**. SRO must align completely with Bing SEO priorities while fully optimizing for Google:
1. **Desktop Performance & TTFB**: Bing prioritizes fast, stable web servers on high-quality CDNs.
2. **Clear On-Page Headers**: Bing depends on structural header hierarchies ($H1$, $H2$, $H3$).
3. **Structured Schema Markup**: Precise microdata helps Bing crawl and render immediate answers directly on search engine results pages (SERPs).

### 6.2 Meta-Tag Specifications

SRO will incorporate comprehensive, optimized metadata.

```html
<!-- Primary SEO Tags -->
<title>Screen Ruler Online - Super-Fast On-Screen Ruler (Inches & CM)</title>
<meta name="description" content="A 100% accurate, lightning-fast on-screen ruler calibrating instantly in inches, cm, and mm. Includes a screen protractor and physical-to-digital unit converter. Free, private, and zero-cost.">
<meta name="keywords" content="screen ruler, online ruler, on screen ruler, inch ruler, cm ruler, measure screen, calibrate ruler, screen calibrator, protractor online, angle finder, unit converter, px to inches, px to cm">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">

<!-- OpenGraph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:title" content="Screen Ruler Online - 100% Accurate Measurement Suite">
<meta property="og:description" content="Calibrate your screen instantly. Get an accurate physical screen ruler in inches and centimeters, a digital protractor, and a real-time pixel converter.">
<meta property="og:url" content="https://screenruler.online/">
<meta property="og:site_name" content="Screen Ruler Online">
<meta property="og:image" content="https://screenruler.online/assets/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">

<!-- Twitter Cards -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Screen Ruler Online - Super-Fast Measurement Suite">
<meta name="twitter:description" content="Measure physical objects on your screen instantly. 100% accurate ruler, SVG protractor, and unit converter.">
<meta name="twitter:image" content="https://screenruler.online/assets/og-image.png">
```

### 6.3 Schema.org JSON-LD Structuring

SRO will embed structured JSON-LD data to facilitate organic rich snippets on both Google and Bing.

#### WebApplication Schema
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Screen Ruler Online",
  "alternateName": "SRO Measurement Suite",
  "url": "https://screenruler.online/",
  "image": "https://screenruler.online/assets/og-image.png",
  "description": "An interactive, accurate on-screen ruler that measures in inches, centimeters, and millimeters. Features screen calibration, an interactive protractor, and a digital unit converter.",
  "applicationCategory": "UtilityApplication",
  "operatingSystem": "All",
  "browserRequirements": "Requires HTML5, ES6+, and SVG support.",
  "features": [
    "Precise physical screen ruler (Inches & CM)",
    "Interactive screen calibrator using cards and coins",
    "On-screen SVG protractor with draggable arms",
    "Physical-to-pixel bidirectional unit converter"
  ],
  "offers": {
    "@type": "Offer",
    "price": "0.00",
    "priceCurrency": "USD"
  }
}
```

#### HowTo Schema (How to Calibrate)
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Calibrate Your On-Screen Ruler Instantly",
  "description": "Step-by-step guide to calibrate your screen ruler online using a standard credit card, coin, or manual PPI entry.",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Select Calibration Reference",
      "text": "Choose a standard physical reference object such as a Credit Card, standard coin, or US Dollar Bill.",
      "url": "https://screenruler.online/#calibrator"
    },
    {
      "@type": "HowToStep",
      "name": "Align Physical Object to Screen",
      "text": "Hold your physical reference object against the highlighted dashed outline on your monitor screen.",
      "url": "https://screenruler.online/#calibrator"
    },
    {
      "@type": "HowToStep",
      "name": "Adjust Slider to Match Dimensions",
      "text": "Drag SRO's on-screen slider until the outline matches the physical width of your object exactly.",
      "url": "https://screenruler.online/#calibrator"
    },
    {
      "@type": "HowToStep",
      "name": "Save and Measure",
      "text": "The calibrated PPI value is instantly calculated and saved. Your on-screen ruler is now 100% accurate.",
      "url": "https://screenruler.online/"
    }
  ]
}
```

---

## 7. Non-Functional & Quality Requirements

### 7.1 Accessibility (a11y)
- **Contrast Ratios**: Core UI text elements must satisfy WCAG 2.1 AA requirements (minimum contrast ratio of $4.5:1$ against background color).
- **Aria Labels**: All interactive buttons, inputs, and SVG handles must carry precise ARIA labeling (e.g., `aria-label="Drag to adjust ruler width"`).
- **Keyboard Navigation**:
  - Drag handles can be focused using standard `Tab` indices.
  - Active focused nodes are fine-tuned using standard Arrow Keys:
    - **Arrow Keys Alone**: Adjust positions/sizes by $1\text{px}$ or $0.1^\circ$.
    - **Shift + Arrow Keys**: Adjust positions/sizes by $10\text{px}$ or $1.0^\circ$.

### 7.2 Responsive Design
- Screen layouts must resize across viewports ranging from small smartphones ($320\text{px}$) to ultra-wide desktop monitors ($3840\text{px}$+).
- The ruler must adapt to portrait or landscape orientations dynamically.

### 7.3 Privacy & Data Sovereignty
- Zero server database endpoints.
- No analytics scripts tracking user coordinates or on-screen content (e.g., hotjar visual tracking is banned).
- All calculated values are confined strictly to the client's browser local memory (`localStorage`).

---

## 8. Success Metrics & KPIs

To validate the product's performance post-launch, the following quantitative metrics will be tracked:

1. **Lighthouse Performance Score**: Maintain a consistent `100/100` score under continuous integration tests.
2. **Search Visibility Index**: Achieve Top 3 ranking on Bing Search within 60 days for terms "screen ruler online" and "online ruler".
3. **Session Retention Rate**: Track the percentage of returning users who retain their calibrated PPI (signaling successful local caching and satisfying UX utility).
4. **Time to First Measure (TTFM)**: Target `< 3 seconds` from page landing to completed alignment/calibration for first-time visitors.

---

## 9. Appendix: Calibration Object Reference Table

| Country / Region | Reference Object | Dimension Category | Metric Value (mm) | Imperial Value (in) |
| :--- | :--- | :--- | :--- | :--- |
| **Global Standard** | ISO Credit Card (ID-1) | Width | 85.60 mm | 3.370 in |
| **Global Standard** | ISO Credit Card (ID-1) | Height | 53.98 mm | 2.125 in |
| **United States** | US $1 Dollar Bill | Width | 156.10 mm | 6.140 in |
| **United States** | US Quarter Coin | Diameter | 24.26 mm | 0.955 in |
| **European Union**| €1 Euro Coin | Diameter | 23.25 mm | 0.915 in |
| **United Kingdom**| £1 Pound Coin | Diameter | 23.43 mm | 0.922 in |
