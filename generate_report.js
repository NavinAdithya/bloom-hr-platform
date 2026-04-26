const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function generatePDF() {
  console.log('Reading local images...');
  const logoPath = 'C:\\Users\\navan\\.gemini\\antigravity\\brain\\1b3f26c1-cf89-4094-b834-cf6aac63100f\\sk_bloom_logo_transparent_1776592555715.png';
  const screenshotPath = 'C:\\Users\\navan\\.gemini\\antigravity\\brain\\1b3f26c1-cf89-4094-b834-cf6aac63100f\\sk_hr_solutions_homepage_verified_1776594310523.png';
  
  const logoB64 = fs.readFileSync(logoPath).toString('base64');
  const screenshotB64 = fs.readFileSync(screenshotPath).toString('base64');

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      background-color: #020617; /* Slate 950 */
      color: #f8fafc;
      line-height: 1.6;
      -webkit-print-color-adjust: exact;
      padding: 0;
      margin: 0;
      width: 100%;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 40px;
      position: relative;
      background-color: #020617;
      overflow: hidden;
      page-break-after: always;
    }

    /* Ambient Glows */
    .glow-1 {
      position: absolute;
      top: -10%; left: -10%;
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%);
      z-index: 0;
    }
    .glow-2 {
      position: absolute;
      bottom: -10%; right: -10%;
      width: 600px; height: 600px;
      background: radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%);
      z-index: 0;
    }
    
    .content-wrapper {
      position: relative;
      z-index: 10;
    }

    /* Header */
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 40px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding-bottom: 20px;
    }
    .header img {
      height: 60px;
      margin-right: 20px;
      filter: drop-shadow(0 0 10px rgba(34,197,94,0.3));
    }
    .header h1 {
      font-size: 28px;
      font-weight: 800;
      color: #fff;
    }
    .header h1 span {
      color: #22c55e;
    }
    .header p {
      font-size: 12px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 600;
    }

    /* Hero Banner */
    .hero-banner {
      width: 100%;
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 40px;
      border: 1px solid rgba(34,197,94,0.2);
      box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(34,197,94,0.1);
    }
    .hero-banner img {
      width: 100%;
      display: block;
    }

    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 25px;
      display: flex;
      align-items: center;
    }
    .section-title::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 24px;
      background: #22c55e;
      border-radius: 4px;
      margin-right: 12px;
      box-shadow: 0 0 10px rgba(34,197,94,0.5);
    }

    /* Grid Layouts */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 40px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-bottom: 40px;
    }

    /* Cards */
    .card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 20px;
      backdrop-filter: blur(10px);
    }
    .card h3 {
      font-size: 16px;
      color: #22c55e;
      margin-bottom: 10px;
      font-weight: 700;
    }
    .card p {
      font-size: 13px;
      color: #cbd5e1;
    }
    .card-list {
      list-style: none;
      margin-top: 10px;
    }
    .card-list li {
      font-size: 13px;
      color: #f1f5f9;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
    }
    .card-list li::before {
      content: '✓';
      color: #22c55e;
      margin-right: 8px;
      font-weight: bold;
    }

    /* Tech Stack Pills */
    .stack-category {
      margin-bottom: 25px;
    }
    .stack-category h4 {
      font-size: 14px;
      color: #94a3b8;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .tech-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .pill {
      background: rgba(34,197,94,0.1);
      border: 1px solid rgba(34,197,94,0.3);
      color: #4ade80;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }
    .pill.fe { border-color: #3b82f6; color: #60a5fa; background: rgba(59,130,246,0.1); }
    .pill.be { border-color: #f59e0b; color: #fbbf24; background: rgba(245,158,11,0.1); }
    .pill.db { border-color: #10b981; color: #34d399; background: rgba(16,185,129,0.1); }
    .pill.do { border-color: #8b5cf6; color: #a78bfa; background: rgba(139,92,246,0.1); }

    /* Footer */
    .footer {
      position: absolute;
      bottom: 40px;
      left: 40px;
      right: 40px;
      border-top: 1px solid rgba(255,255,255,0.1);
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
    }
  </style>
</head>
<body>

  <!-- PAGE 1: Overview & Architecture -->
  <div class="page">
    <div class="glow-1"></div>
    <div class="glow-2"></div>
    
    <div class="content-wrapper">
      <div class="header">
        <img src="data:image/png;base64,${logoB64}" alt="Logo">
        <div>
          <h1>SK HR Solutions <span>Platform Report</span></h1>
          <p>Enterprise SaaS Architecture & Deployment</p>
        </div>
      </div>

      <div class="hero-banner">
        <img src="data:image/png;base64,${screenshotB64}" alt="Platform UI Screenshot">
      </div>

      <div class="section-title">Executive Summary</div>
      <p style="font-size: 14px; color: #e2e8f0; margin-bottom: 30px; line-height: 1.8;">
        The SK HR Solutions platform is a fully-scalable, high-performance web application designed for a premium user experience and bulletproof data security. By leveraging modern headless architecture, the system cleanly isolates the high-fidelity Next.js frontend from the robust Node.js backend infrastructure, ensuring maximum uptime, SEO superiority, and military-grade performance.
      </p>

      <div class="section-title">Core Technology Stack</div>
      
      <div class="stack-category">
        <h4>1. Frontend Ecosystem (The Interface)</h4>
        <div class="tech-pills">
          <div class="pill fe">Next.js 14 (App Router)</div>
          <div class="pill fe">React 18</div>
          <div class="pill fe">TypeScript</div>
          <div class="pill fe">Tailwind CSS v3</div>
          <div class="pill fe">Framer Motion (3D & Animations)</div>
        </div>
      </div>

      <div class="stack-category">
        <h4>2. Backend Infrastructure (The Engine)</h4>
        <div class="tech-pills">
          <div class="pill be">Node.js</div>
          <div class="pill be">Express.js (REST API)</div>
          <div class="pill be">TypeScript</div>
          <div class="pill be">Bcrypt (Cryptography)</div>
          <div class="pill be">JWT Auth</div>
        </div>
      </div>

      <div class="stack-category">
        <h4>3. Database & State (The Memory)</h4>
        <div class="tech-pills">
          <div class="pill db">MongoDB Atlas (Cloud NoSQL)</div>
          <div class="pill db">Mongoose ODM</div>
          <div class="pill db">SWR (Client Data Fetching)</div>
        </div>
      </div>

      <div class="stack-category">
        <h4>4. DevSecOps & Deployment (The Cloud)</h4>
        <div class="tech-pills">
          <div class="pill do">Netlify Edge (Frontend CDN)</div>
          <div class="pill do">Render Cloud (Backend Host)</div>
          <div class="pill do">Nodemailer (SMTP Relay)</div>
          <div class="pill do">GitHub (VCS)</div>
        </div>
      </div>

      <div class="footer">
        <div>Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <div>CONFIDENTIAL & PROPRIETARY</div>
      </div>
    </div>
  </div>

  <!-- PAGE 2: Features & Security -->
  <div class="page">
    <div class="glow-1" style="background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%); left: auto; right: -10%;"></div>
    <div class="glow-2" style="background: radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%); bottom: auto; top: -10%; left: -10%;"></div>
    
    <div class="content-wrapper">
      <div class="header">
        <img src="data:image/png;base64,${logoB64}" alt="Logo">
        <div>
          <h1>System Capabilities <span>& Security</span></h1>
          <p>Highlighting the premium features of the platform</p>
        </div>
      </div>

      <div class="section-title">Premium User Experience (UX/UI)</div>
      <div class="grid-2">
        <div class="card">
          <h3>Hardware-Accelerated Animations</h3>
          <p>Utilizing Framer Motion to deliver 60fps micro-interactions without jitter.</p>
          <ul class="card-list">
            <li>Staggered entrance reveals</li>
            <li>Magnetic mouse-tracking buttons</li>
            <li>Scroll-progress indicators (shimmer)</li>
            <li>3D tilting cards based on cursor bounds</li>
          </ul>
        </div>
        <div class="card">
          <h3>Glassmorphic Design System</h3>
          <p>A sophisticated blend of frosted-glass overlays and dark-mode elegance.</p>
          <ul class="card-list">
            <li>Adaptive CSS backdrop-filters</li>
            <li>Gradient mesh ambient backgrounds</li>
            <li>Smooth Theme Toggle (Light/Dark)</li>
            <li>Intelligent navbar scroll-hiding</li>
          </ul>
        </div>
      </div>

      <div class="section-title">Security & Authentication Hardening</div>
      <div class="grid-2">
        <div class="card" style="border-color: rgba(220,38,38,0.3);">
          <h3 style="color: #f87171;">Brute-Force Protection</h3>
          <p>The admin gateway is strictly fortified against malicious intrusion.</p>
          <ul class="card-list">
            <li>express-rate-limit active</li>
            <li>15-min IP lockouts after 5 bad tries</li>
            <li>Intentional latency simulation on auth</li>
          </ul>
        </div>
        <div class="card" style="border-color: rgba(220,38,38,0.3);">
          <h3 style="color: #f87171;">Secure Session Management</h3>
          <p>Zero-trust methodology for handling administrative tokens across boundaries.</p>
          <ul class="card-list">
            <li>Bcrypt password hashing (Salt Rounds: 10)</li>
            <li>Strict cross-origin CSRF defenses</li>
            <li>Cookie-based JWTs (SameSite=None, Secure)</li>
          </ul>
        </div>
      </div>

      <div class="section-title">Core Features & Pipelines</div>
      <div class="grid-3">
        <div class="card">
          <h3>Headless CMS Engine</h3>
          <p>Custom MongoDB pipeline powering the dynamic Testimonials, Clients, and Services blocks without requiring hard-code changes.</p>
        </div>
        <div class="card">
          <h3>Async Email Relays</h3>
          <p>Nodemailer SMTP integration instantly fires rich HTML inquiry alerts to the owner, executed asynchronously for zero UI latency.</p>
        </div>
        <div class="card">
          <h3>Global Edge Delivery</h3>
          <p>Deployed strictly on Tier-1 global CDNs (Netlify) ensuring sub-second load times regardless of client geography.</p>
        </div>
      </div>

      <div class="footer">
        <div>Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <div>SK HR SOLUTIONS - TECHNICAL DOSSIER</div>
      </div>
    </div>
  </div>

</body>
</html>
  `;

  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  // Render to PDF
  const outputPath = path.join(__dirname, 'SK_HR_Solutions_Tech_Stack.pdf');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0'}
  });

  await browser.close();
  console.log('PDF generated at:', outputPath);
}

generatePDF().catch(console.error);
