// Main TGC Launch Miniapp View
import { getFeybotSVG, getSVGStyles } from '../components/feybot-svg.js';

export function getMainTGCLaunchView(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Feybot - Token Generation Ceremony</title>
        <meta name="fc:miniapp" content='{"version":"1","imageUrl":"https://feybot.orbiter.website/og-image.png","button":{"title":"Launch TGC","action":{"type":"launch_miniapp","name":"Feybot TGC","url":"${process.env.BASE_URL || 'https://feybot.orbiter.website'}","splashImageUrl":"https://feybot.orbiter.website/splash.png","splashBackgroundColor":"#0C6300"}}}' />
        <script src="https://unpkg.com/htmx.org@1.9.10"></script>
        <script src="https://unpkg.com/hyperscript.org@0.9.12"></script>
        
        ${getSVGStyles()}
        
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Courier New', monospace;
                background: #000;
                color: #4FC65F;
                overflow: hidden;
                height: 100vh;
                position: relative;
            }
            
            .video-background {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: -2;
                object-fit: cover;
                opacity: 0.6;
            }
            
            .fractal-background {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: -1;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.8;
            }
            
            .main-container {
                position: relative;
                z-index: 10;
                height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 2rem;
                text-align: center;
            }
            
            .feybot-title {
                font-size: 3rem;
                font-weight: bold;
                margin-bottom: 1rem;
                text-shadow: 0 0 20px #4FC65F;
                animation: title-glow 2s ease-in-out infinite alternate;
            }
            
            .feybot-subtitle {
                font-size: 1.2rem;
                margin-bottom: 3rem;
                opacity: 0.9;
                max-width: 600px;
                line-height: 1.6;
            }
            
            .start-tgc-button {
                background: linear-gradient(45deg, #4FC65F, #3EA34B);
                border: none;
                color: #000;
                font-size: 2rem;
                font-weight: bold;
                padding: 1.5rem 3rem;
                border-radius: 50px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 0 30px rgba(79, 198, 95, 0.5);
                font-family: 'Courier New', monospace;
                text-transform: uppercase;
                letter-spacing: 2px;
                position: relative;
                overflow: hidden;
                z-index: 100;
            }
            
            .start-tgc-button:hover {
                transform: scale(1.1);
                box-shadow: 0 0 50px rgba(79, 198, 95, 0.8);
                background: linear-gradient(45deg, #3EA34B, #4FC65F);
            }
            
            .start-tgc-button:active {
                transform: scale(0.95);
            }
            
            .start-tgc-button::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
                transform: rotate(45deg);
                transition: all 0.5s;
                opacity: 0;
            }
            
            .start-tgc-button:hover::before {
                animation: shine 0.5s ease-out;
            }
            
            .audio-background {
                position: fixed;
                top: 0;
                left: 0;
                z-index: -10;
            }
            
            .splash-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 5;
            }
            
            @keyframes title-glow {
                0% { text-shadow: 0 0 20px #4FC65F; }
                100% { text-shadow: 0 0 40px #4FC65F, 0 0 60px #3EA34B; }
            }
            
            @keyframes shine {
                0% {
                    transform: translateX(-100%) translateY(-100%) rotate(45deg);
                    opacity: 0;
                }
                50% {
                    opacity: 1;
                }
                100% {
                    transform: translateX(100%) translateY(100%) rotate(45deg);
                    opacity: 0;
                }
            }
            
            @media (max-width: 768px) {
                .feybot-title {
                    font-size: 2rem;
                }
                
                .feybot-subtitle {
                    font-size: 1rem;
                    margin-bottom: 2rem;
                }
                
                .start-tgc-button {
                    font-size: 1.5rem;
                    padding: 1rem 2rem;
                }
            }
        </style>
    </head>
    <body>
        <!-- Background Video -->
        <video autoplay muted loop class="video-background" id="background-video">
            <source src="https://feybot.orbiter.website/background.mp4" type="video/mp4">
            <source src="https://feybot.orbiter.website/background.webm" type="video/webm">
        </video>
        
        <!-- Background Audio -->
        <audio autoplay loop class="audio-background" id="background-audio">
            <source src="https://feybot.orbiter.website/ambient.mp3" type="audio/mpeg">
            <source src="https://feybot.orbiter.website/ambient.ogg" type="audio/ogg">
        </audio>
        
        <!-- Fractal Background -->
        <div class="fractal-background" 
             _="on click 
                if target !== me then 
                  call createFractalSplash(event.clientX, event.clientY) 
                end">
            ${getFeybotSVG(true)}
        </div>
        
        <!-- Splash Container for Effects -->
        <div class="splash-container" id="splash-container"></div>
        
        <!-- Main Content -->
        <div class="main-container">
            <h1 class="feybot-title">FEYBOT</h1>
            <p class="feybot-subtitle">
                Welcome to the Fey Protocol Token Generation Ceremony interface. 
                Create tokens with advanced liquidity, hooks, and extensions on Base.
                Experience the future of token launches.
            </p>
            
            <button class="start-tgc-button" 
                    hx-get="/api/tgc/start-interface"
                    hx-target="#main-app"
                    hx-swap="outerHTML"
                    _="on click 
                       add .loading to me 
                       set my innerHTML to 'LAUNCHING...'">
                START TGC
            </button>
        </div>
        
        <div id="main-app"></div>
        
        <script>
            // Fractal splash effect
            function createFractalSplash(x, y) {
                const splashContainer = document.getElementById('splash-container');
                const splash = document.createElement('div');
                splash.className = 'fractal-splash';
                splash.innerHTML = \`${getFeybotSVG(false).replace(/"/g, '\\"')}\`;
                splash.style.left = (x - 75) + 'px';
                splash.style.top = (y - 75) + 'px';
                splash.style.width = '150px';
                splash.style.height = '150px';
                
                splashContainer.appendChild(splash);
                
                // Remove splash after animation
                setTimeout(() => {
                    if (splash.parentNode) {
                        splash.parentNode.removeChild(splash);
                    }
                }, 800);
            }
            
            // Initialize audio and video
            document.addEventListener('DOMContentLoaded', function() {
                const video = document.getElementById('background-video');
                const audio = document.getElementById('background-audio');
                
                // Set initial volume
                if (audio) {
                    audio.volume = 0.3;
                }
                
                // User interaction to start audio (required by browsers)
                document.addEventListener('click', function enableAudio() {
                    if (audio && audio.paused) {
                        audio.play().catch(e => console.log('Audio autoplay prevented:', e));
                    }
                    document.removeEventListener('click', enableAudio);
                }, { once: true });
                
                // Fallback if video fails to load
                if (video) {
                    video.addEventListener('error', function() {
                        video.style.display = 'none';
                        document.body.style.background = 'linear-gradient(45deg, #0C6300, #000)';
                    });
                }
            });
            
            // Add to global scope for hyperscript
            window.createFractalSplash = createFractalSplash;
        </script>
    </body>
    </html>
  `;
}