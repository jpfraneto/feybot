// Feybot SVG Component with animations and transformations
export function getFeybotSVG(animated: boolean = false): string {
  const animationClass = animated ? 'feybot-animated' : '';
  
  return `
    <svg width="755" height="755" viewBox="0 0 1510 1511" fill="none" xmlns="http://www.w3.org/2000/svg" class="feybot-svg ${animationClass}" id="feybot-fractal">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <radialGradient id="fractalGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:#4FC65F;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#3EA34B;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#0C6300;stop-opacity:0.6" />
        </radialGradient>
        
        <pattern id="sparkle" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="2" fill="#ffffff" opacity="0.7">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="80" cy="60" r="1.5" fill="#ffffff" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0.9;0.5" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="50" cy="90" r="1" fill="#ffffff" opacity="0.6">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1.8s" repeatCount="indefinite"/>
          </circle>
        </pattern>
      </defs>
      
      <!-- Outer fractal layer -->
      <path d="M755.866 1.17703L799.304 474.579L986.829 37.7284C987.358 36.669 988.948 37.1987 988.771 38.4347L883.885 502.125L1197.31 144.734C1198.19 143.851 1199.6 144.734 1198.9 145.97L955.751 554.392L1364.17 311.246C1365.23 310.54 1366.29 312.129 1365.41 312.835L1008.02 626.259L1471.53 521.372C1472.77 521.019 1473.3 522.785 1472.06 523.315L1035.39 710.839L1508.61 754.277C1509.85 754.277 1509.85 756.219 1508.61 756.219L1035.39 799.657L1472.06 987.182C1473.12 987.712 1472.59 989.301 1471.53 989.124L1008.02 884.238L1365.41 1197.66C1366.29 1198.54 1365.41 1199.96 1364.17 1199.25L955.751 956.104L1198.9 1364.53C1199.6 1365.59 1198.01 1366.65 1197.31 1365.76L883.885 1008.37L988.771 1472.06C989.124 1473.3 987.358 1473.83 986.829 1472.77L799.304 1035.92L755.866 1509.32C755.866 1510.56 753.924 1510.56 753.924 1509.32L710.486 1035.92L522.961 1472.77C522.432 1473.83 520.843 1473.3 521.019 1472.06L625.906 1008.37L312.482 1365.76C311.599 1366.65 310.186 1365.76 310.893 1364.53L554.039 956.104L145.617 1199.25C144.557 1199.96 143.498 1198.37 144.381 1197.66L501.772 884.238L38.2582 989.124C37.0221 989.477 36.4924 987.712 37.7284 987.182L474.403 799.657L1.17703 756.219C-0.0590094 756.219 -0.0590094 754.277 1.17703 754.277L474.403 710.839L37.7284 523.315C36.669 522.785 37.1987 521.196 38.2582 521.372L501.772 626.259L144.381 312.835C143.498 311.952 144.381 310.54 145.617 311.246L554.039 554.392L310.893 145.97C310.186 144.911 311.776 143.851 312.482 144.734L625.906 502.125L521.019 38.4347C520.666 37.1987 522.432 36.669 522.961 37.7284L710.486 474.579L753.924 1.17703C753.924 -0.0590094 755.866 -0.0590094 755.866 1.17703Z" 
            fill="url(#fractalGradient)" 
            stroke="#3EA34B" 
            stroke-width="0.5" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            filter="url(#glow)"
            class="fractal-outer">
        ${animated ? `
          <animateTransform 
            attributeName="transform" 
            attributeType="XML" 
            type="rotate" 
            from="0 755 755" 
            to="360 755 755" 
            dur="30s" 
            repeatCount="indefinite"/>
        ` : ''}
      </path>
      
      <!-- Middle fractal layer -->
      <path d="M710.662 471.929L754.807 615.485L798.951 471.929C798.951 471.222 800.363 471.399 800.363 472.105L798.068 622.195L884.414 499.298C884.944 498.592 886.003 499.298 885.65 500.004L837.091 642.149L957.164 551.918C957.87 551.388 958.753 552.271 958.223 552.977L867.992 673.05L1010.14 624.491C1010.84 624.138 1011.37 625.197 1010.84 625.727L887.945 712.073L1038.04 709.778C1038.92 709.778 1039.1 711.014 1038.04 711.19L894.479 755.334L1038.04 799.479C1038.74 799.479 1038.57 800.891 1038.04 800.891L887.945 798.596L1010.84 884.942C1011.55 885.471 1010.84 886.531 1010.14 886.178L867.992 837.619L958.223 957.691C958.753 958.398 957.87 959.281 957.164 958.751L837.091 868.52L885.65 1010.66C886.003 1011.37 884.944 1011.9 884.414 1011.37L798.068 888.473L800.363 1038.56C800.363 1039.45 799.127 1039.62 798.951 1038.56L754.807 895.007L710.662 1038.56C710.486 1039.27 709.25 1039.09 709.25 1038.56L711.545 888.473L625.199 1011.37C624.669 1012.08 623.61 1011.37 623.963 1010.66L672.522 868.52L552.45 958.751C551.743 959.281 550.86 958.398 551.39 957.691L641.621 837.619L499.476 886.178C498.77 886.531 498.24 885.471 498.77 884.942L621.668 798.596L471.577 800.891C470.694 800.891 470.518 799.655 471.401 799.479L614.958 755.334L471.401 711.19C470.694 711.014 470.871 709.778 471.577 709.778L621.668 712.073L498.77 625.727C498.064 625.197 498.77 624.138 499.476 624.491L641.621 673.05L551.39 552.977C550.86 552.271 551.743 551.388 552.45 551.918L672.522 642.149L623.963 500.004C623.61 499.298 624.669 498.768 625.199 499.298L711.545 622.195L709.25 472.105C709.25 471.222 710.486 471.046 710.662 471.929Z" 
            fill="#0C6300"
            class="fractal-middle">
        ${animated ? `
          <animateTransform 
            attributeName="transform" 
            attributeType="XML" 
            type="rotate" 
            from="0 755 755" 
            to="-360 755 755" 
            dur="20s" 
            repeatCount="indefinite"/>
        ` : ''}
      </path>
      
      <!-- Inner fractal core -->
      <path d="M754.807 613.369L765.931 685.412L798.774 620.256L786.944 692.299L838.327 640.385L804.954 705.189L869.758 671.816L817.845 723.2L889.888 711.369L824.731 744.212L896.951 755.337L824.731 766.285L889.888 799.128L817.845 787.474L869.758 838.681L804.954 805.308L838.327 870.112L786.944 818.375L798.774 890.418L765.931 825.085L754.807 897.305L743.859 825.085L711.016 890.418L722.846 818.375L671.462 870.112L704.835 805.308L640.032 838.681L691.769 787.474L619.902 799.128L685.059 766.285L612.839 755.337L685.059 744.212L619.902 711.369L691.769 723.2L640.032 671.816L704.835 705.189L671.462 640.385L722.846 692.299L711.016 620.256L743.859 685.412L754.807 613.369Z" 
            fill="#4FC65F" 
            stroke="#4FC65F" 
            stroke-width="0.5" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            filter="url(#glow)"
            class="fractal-inner">
        ${animated ? `
          <animateTransform 
            attributeName="transform" 
            attributeType="XML" 
            type="rotate" 
            from="0 755 755" 
            to="360 755 755" 
            dur="15s" 
            repeatCount="indefinite"/>
          <animate 
            attributeName="fill" 
            values="#4FC65F;#3EA34B;#4FC65F" 
            dur="3s" 
            repeatCount="indefinite"/>
        ` : ''}
      </path>
      
      ${animated ? `
        <!-- Sparkle overlay for magical effect -->
        <rect width="100%" height="100%" fill="url(#sparkle)" opacity="0.3"/>
      ` : ''}
    </svg>
  `;
}

export function getSVGStyles(): string {
  return `
    <style>
      .feybot-svg {
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .feybot-svg:hover {
        filter: drop-shadow(0 0 20px #4FC65F);
        transform: scale(1.05);
      }
      
      .fractal-outer, .fractal-middle, .fractal-inner {
        transform-origin: center;
      }
      
      .feybot-animated .fractal-outer {
        animation: rotate-slow 30s linear infinite;
      }
      
      .feybot-animated .fractal-middle {
        animation: rotate-medium 20s linear infinite reverse;
      }
      
      .feybot-animated .fractal-inner {
        animation: rotate-fast 15s linear infinite, pulse-glow 3s ease-in-out infinite;
      }
      
      @keyframes rotate-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      @keyframes rotate-medium {
        from { transform: rotate(0deg); }
        to { transform: rotate(-360deg); }
      }
      
      @keyframes rotate-fast {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      @keyframes pulse-glow {
        0%, 100% { filter: drop-shadow(0 0 5px #4FC65F); }
        50% { filter: drop-shadow(0 0 15px #4FC65F); }
      }
      
      .fractal-splash {
        position: absolute;
        pointer-events: none;
        transform: scale(0);
        animation: splash-effect 0.8s ease-out forwards;
      }
      
      @keyframes splash-effect {
        0% {
          transform: scale(0) rotate(0deg);
          opacity: 1;
        }
        50% {
          transform: scale(1.2) rotate(180deg);
          opacity: 0.8;
        }
        100% {
          transform: scale(1.8) rotate(360deg);
          opacity: 0;
        }
      }
    </style>
  `;
}