const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach(function(file) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkSync(filePath, filelist);
    } else if (file.endsWith('.tsx')) {
      filelist.push(filePath);
    }
  });
  return filelist;
}

const adminDir = path.join(__dirname, 'apps/web/src/app/admin');
const files = walkSync(adminDir);

// Skip files we already rewrote manually
const skip = ['page.tsx', 'layout.tsx'].map(f => path.join(adminDir, f));
skip.push(path.join(adminDir, 'login', 'page.tsx'));

let count = 0;
files.forEach(file => {
  if (skip.includes(file)) return;

  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Fix duplicate/broken classes from prior batch replace
  content = content.replace(/border-white\/10 bg-\[#020617\] px-4 py-3 text-sm outline-none transition focus:border-\[#22c55e\] focus:ring-1 focus:ring-\[#22c55e\] border-white\/5 bg-\[#020617\]/g,
    "border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#020617] px-4 py-3 text-[14px] text-slate-900 dark:text-white outline-none transition-all focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]");

  content = content.replace(/border-white\/10 bg-\[#0f172a\] px-4 py-3 text-sm border-white\/5 bg-\[rgba\(255,255,255,0\.02\)\]/g,
    "border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#020617] px-4 py-3 text-[14px]");

  content = content.replace(/border-white\/10 bg-\[#0f172a\] p-4 text-sm border-white\/5 bg-\[rgba\(255,255,255,0\.02\)\]/g,
    "border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#020617] p-4 text-[14px]");

  // Table container
  content = content.replace(/overflow-auto rounded-2xl border border-white\/10 bg-\[#0f172a\]/g,
    "overflow-auto rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#0f172a]");

  // Table head
  content = content.replace(/border-b border-white\/10 bg-\[#0f172a\] border-white\/5 bg-transparent/g,
    "border-b border-black/5 dark:border-white/5 bg-slate-50 dark:bg-[#0f172a]/50");

  // Table row borders
  content = content.replace(/border-b border-white\/5 border-white\/5/g,
    "border-b border-black/5 dark:border-white/5");

  // Notification
  content = content.replace(/border-\[#22c55e\]\/20 bg-\[#22c55e\]\/10 px-4 py-3 text-sm font-medium text-\[#22c55e\]/g,
    "border-[#22c55e]/20 bg-[#22c55e]/10 px-4 py-3 text-[13px] font-medium text-[#22c55e]");

  // Label text
  content = content.replace(/text-xs text-\[#94a3b8\]/g,
    "text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase");

  // Section title  
  content = content.replace(/text-sm font-semibold text-\[#94a3b8\]/g,
    "text-[12px] font-bold tracking-wider text-slate-400 dark:text-[#94a3b8] uppercase");

  // Main heading
  content = content.replace(/text-xl font-semibold/g, "text-[20px] font-bold tracking-tight");

  // Primary buttons
  content = content.replace(/bg-gradient-to-r from-\[#22c55e\] to-emerald-400 px-5 py-3 text-sm font-bold text-\[#020617\] shadow-\[0_0_20px_rgba\(34,197,94,0\.3\)\] transition hover:scale-\[1\.02\] hover:shadow-\[0_0_30px_rgba\(34,197,94,0\.4\)\]/g,
    "bg-gradient-to-r from-[#22c55e] to-emerald-400 px-5 py-3 text-[13px] font-bold text-white dark:text-[#020617] shadow-sm transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]");

  // Secondary outline buttons
  content = content.replace(/border border-white\/10 bg-white\/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white\/10 hover:border-white\/20/g,
    "border border-black/10 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-5 py-3 text-[13px] font-semibold transition hover:bg-slate-200 dark:hover:bg-white/10");

  // Table action buttons - Edit  
  content = content.replace(/border border-white\/10 bg-white\/5 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white\/10/g,
    "border border-black/10 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-1.5 text-[12px] font-semibold transition-all hover:bg-slate-200 dark:hover:bg-white/10");

  // Table action buttons - Delete
  content = content.replace(/border border-red-500\/20 bg-red-500\/10 px-3 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500\/20 hover:border-red-500\/30/g,
    "border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 text-[12px] font-semibold text-red-600 dark:text-red-400 transition-all hover:bg-red-100 dark:hover:bg-red-500/20");

  // Active checkbox label
  content = content.replace(/<span className="text-white">Active<\/span>/g,
    '<span className="text-slate-800 dark:text-white">Active</span>');

  // Error text
  content = content.replace(/text-red-600 dark:text-red-400/g,
    "text-red-500");

  // Category cell text
  content = content.replace(/text-\[#94a3b8\]">{s\.category/g,
    'text-slate-500 dark:text-[#94a3b8]">{s.category');

  if (content !== original) {
    fs.writeFileSync(file, content);
    count++;
  }
});

console.log(`Updated ${count} admin files with light/dark dual-mode classes.`);
