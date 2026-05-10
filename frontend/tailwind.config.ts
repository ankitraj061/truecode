// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        // Truck loader animations
        'truck-motion': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(3px)' },
        },
        'road': {
          '0%': { transform: 'translateX(0px)' },
          '100%': { transform: 'translateX(-350px)' },
        },
        'tire-rotate': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        // Ripple effect animation (for buttons)
        'ripple': {
          '0%': { width: '0', height: '0', opacity: '0.5' },
          '100%': { width: '500px', height: '500px', opacity: '0' },
        },
        // Dropdown animation
        'slideDown': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Fade in animation
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // Slide up animation
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Gradient shift animation
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        // Pulse animation (for premium crown)
        'pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        // Bounce animation (for premium crown)
        'bounce': {
          '0%, 100%': { 
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' 
          },
          '50%': { 
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' 
          },
        },
      },
      animation: {
        // Truck loader animations
        'truck-motion': 'truck-motion 1s linear infinite',
        'road': 'road 1.4s linear infinite',
        'tire-rotate': 'tire-rotate 1s linear infinite',
        // UI animations
        'ripple': 'ripple 0.6s ease-out',
        'slideDown': 'slideDown 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.6s ease-out',
        'gradient-shift': 'gradient-shift 3s ease infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce': 'bounce 1s infinite',
      },
      // Additional utility for background size (for gradient animation)
      backgroundSize: {
        '200': '200% 200%',
      },
    },
  },
};

export default config;
