const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  var files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.tsx') && !file.endsWith('admin/page.tsx') && !file.endsWith('admin/layout.tsx') && !file.endsWith('admin/login/page.tsx')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const adminDir = path.join(__dirname, 'apps/web/src/app/admin');
const files = walkSync(adminDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Base Replacements
  content = content.replace(/bg-gradient-to-br from-brand-teal to-brand-green px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:opacity-95/g, 
    "bg-gradient-to-r from-[#22c55e] to-emerald-400 px-5 py-3 text-sm font-bold text-[#020617] shadow-[0_0_20px_rgba(34,197,94,0.3)] transition hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)]");

  // Secondary buttons
  content = content.replace(/rounded-xl border border-slate-200\/70 bg-white\/60 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white\/80 dark:border-slate-800\/70 dark:bg-slate-900\/30 dark:text-slate-200/g,
    "rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 hover:border-white/20");
  
  // Table Action Buttons
  content = content.replace(/rounded-xl border border-slate-200\/70 bg-white\/60 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-white\/80 dark:border-slate-800\/70 dark:bg-slate-900\/30 dark:text-slate-200/g,
    "rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/10");

  content = content.replace(/rounded-xl border border-red-200\/70 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-900\/60 dark:bg-red-950\/30 dark:text-red-200/g,
    "rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 hover:border-red-500/30");

  // Colors
  content = content.replaceAll("bg-white/70", "bg-[#020617]");
  content = content.replaceAll("bg-white/60", "bg-[#0f172a]");
  content = content.replaceAll("bg-white/50", "bg-[#0f172a]");
  
  content = content.replaceAll("border-slate-200/80", "border-white/10");
  content = content.replaceAll("border-slate-200/70", "border-white/10");
  content = content.replaceAll("border-slate-200/50", "border-white/5");

  content = content.replaceAll("text-slate-600 dark:text-slate-300", "text-[#94a3b8]");
  content = content.replaceAll("text-slate-500 dark:text-slate-400", "text-[#94a3b8]");
  content = content.replaceAll("text-slate-700 dark:text-slate-200", "text-white");
  
  content = content.replaceAll("dark:border-slate-800/70", "border-white/5");
  content = content.replaceAll("dark:border-slate-800/50", "border-white/5");
  content = content.replaceAll("dark:bg-slate-900/40", "bg-[#020617]");
  content = content.replaceAll("dark:bg-slate-900/30", "bg-[rgba(255,255,255,0.02)]");
  content = content.replaceAll("dark:bg-slate-900/20", "bg-transparent");
  
  content = content.replaceAll("focus:border-brand-teal", "focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]");
  content = content.replaceAll("border border-brand-teal/30 bg-brand-teal/10 px-4 py-3 text-sm text-brand-teal dark:border-brand-teal/40 dark:bg-brand-teal/20",
    "border border-[#22c55e]/20 bg-[#22c55e]/10 px-4 py-3 text-sm font-medium text-[#22c55e]");

  fs.writeFileSync(file, content);
});
console.log("Successfully replaced legacy UI elements across " + files.length + " admin modules.");
