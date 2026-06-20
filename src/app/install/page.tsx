"use client";

import { useEffect, useState } from "react";

type Device = "iphone" | "android" | "desktop";

function detectDevice(): Device {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "iphone";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

const steps: Record<Device, { icon: string; text: string }[]> = {
  iphone: [
    { icon: "🧭", text: 'Open the Safari app — it looks like a blue compass. Chrome does NOT work on iPhone for this!' },
    { icon: "🔗", text: 'Type this in Safari: hoa-manager-phi.vercel.app' },
    { icon: "⬆️", text: 'Tap the Share button — the box with an arrow pointing up, at the bottom of the screen' },
    { icon: "👇", text: 'Scroll down in the menu and tap "Add to Home Screen"' },
    { icon: "✅", text: 'Tap "Add" in the top right corner' },
    { icon: "🎉", text: 'Done! The app icon is now on your home screen' },
  ],
  android: [
    { icon: "🌐", text: 'Open this page in Chrome (the colourful circle app)' },
    { icon: "⋮", text: 'Tap the three dots in the top right corner' },
    { icon: "📲", text: 'Tap "Add to Home Screen"' },
    { icon: "✅", text: 'Tap "Add"' },
    { icon: "🎉", text: 'Done! The app is now on your home screen' },
  ],
  desktop: [
    { icon: "🌐", text: 'Open this page in Chrome or Edge' },
    { icon: "⊕", text: 'Click the install icon in the address bar (top right)' },
    { icon: "✅", text: 'Click "Install"' },
    { icon: "🎉", text: 'Done! The app opens like a normal program' },
  ],
};

const deviceLabels: Record<Device, string> = {
  iphone: "iPhone",
  android: "Samsung / Android",
  desktop: "Computer",
};

const deviceIcons: Record<Device, string> = {
  iphone: "🍎",
  android: "🤖",
  desktop: "💻",
};

export default function InstallPage() {
  const [device, setDevice] = useState<Device>("iphone");

  useEffect(() => {
    setDevice(detectDevice());
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg">
          <span className="text-white text-4xl font-bold">H</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Install the app</h1>
        <p className="text-muted-foreground text-lg">Follow the steps below 👇</p>
      </div>

      {/* Device tabs */}
      <div className="flex gap-2 mb-8 bg-secondary rounded-2xl p-1.5 w-full max-w-sm">
        {(["iphone", "android", "desktop"] as Device[]).map((d) => (
          <button
            key={d}
            onClick={() => setDevice(d)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${
              device === d
                ? "bg-blue-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="text-xl">{deviceIcons[d]}</span>
            {deviceLabels[d]}
          </button>
        ))}
      </div>

      {/* Steps */}
      <div className="w-full max-w-sm space-y-4">
        {steps[device].map((step, i) => (
          <div
            key={i}
            className="flex items-center gap-4 bg-card border border-border rounded-2xl px-5 py-4 shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
              {i + 1}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{step.icon}</span>
              <p className="text-foreground text-base font-medium leading-snug">{step.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* URL reminder */}
      <div className="mt-10 w-full max-w-sm bg-secondary border border-border rounded-2xl px-5 py-4 text-center">
        <p className="text-muted-foreground text-sm mb-1">The app address is:</p>
        <p className="text-primary font-bold text-lg break-all">hoa-manager-phi.vercel.app</p>
      </div>

      {/* Login instructions */}
      <div className="mt-6 w-full max-w-sm bg-card border border-border rounded-2xl px-5 py-5">
        <h2 className="text-foreground font-bold text-lg mb-4 text-center">🔐 How to log in</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">1</div>
            <p className="text-foreground text-sm pt-1">Open the app and tap <strong>Sign in</strong></p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">2</div>
            <p className="text-foreground text-sm pt-1">Enter your <strong>email address</strong></p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">3</div>
            <div className="pt-1">
              <p className="text-foreground text-sm">Your first password is:</p>
              <p className="text-primary font-bold text-2xl tracking-widest mt-1">LA26</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">4</div>
            <p className="text-foreground text-sm pt-1">Once inside, go to <strong>Settings ⚙️</strong> to choose your own personal password</p>
          </div>
        </div>
      </div>

      {/* Forgot password */}
      <div className="mt-4 w-full max-w-sm bg-secondary border border-border rounded-2xl px-5 py-4 text-center">
        <p className="text-muted-foreground text-sm">Forgot your password? Tap <strong className="text-foreground">"Forgot password?"</strong> on the login screen and we will send a reset link to your email. 📬</p>
      </div>

      <p className="text-muted-foreground text-sm mt-8 text-center max-w-xs">
        Need help? Ask your building manager 🏠
      </p>
    </div>
  );
}
