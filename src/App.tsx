import React, { useState, useEffect, Suspense, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue, animate } from 'motion/react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere, useTexture, Html, Loader } from '@react-three/drei';
import * as THREE from 'three';
import { 
  ArrowRight, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Linkedin,
  Maximize2,
  Compass,
  Minus,
  Info,
  Layers
} from 'lucide-react';

type View = 'landing' | 'door' | 'villa' | 'exit';
type VillaSection = 'living' | 'kitchen';

interface Hotspot {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  top: string;
  left: string;
  zoomX: number; // Percentage shift to center
  zoomY: number;
}

const HOTSPOTS: Record<VillaSection, Hotspot[]> = {
  living: [
    {
      id: 'marble',
      title: 'Statuario Marble',
      subtitle: 'Bespoke Wall',
      description: 'Book-matched Italian marble with integrated ambient lighting strips.',
      top: '40%',
      left: '30%',
      zoomX: 25,
      zoomY: 15
    },
    {
      id: 'sectional',
      title: 'Velvet Sectional',
      subtitle: 'Furnishing',
      description: 'Custom-designed modular seating upholstered in premium mohair velvet.',
      top: '70%',
      left: '60%',
      zoomX: -15,
      zoomY: -25
    },
    {
      id: 'chandelier',
      title: 'Crystal Cascade',
      subtitle: 'Lighting',
      description: 'Hand-blown glass elements with dimmable warm-spectrum LEDs.',
      top: '20%',
      left: '50%',
      zoomX: 0,
      zoomY: 35
    }
  ],
  kitchen: [
    {
      id: 'chimney',
      title: 'Smart Chimney',
      subtitle: 'Technology',
      description: 'Integrated silent extraction system with gesture control and auto-cleaning.',
      top: '30%',
      left: '70%',
      zoomX: -25,
      zoomY: 25
    },
    {
      id: 'cabinetry',
      title: 'Soft-Touch',
      subtitle: 'Cabinetry',
      description: 'Handle-less modular units with anti-fingerprint matte finish.',
      top: '60%',
      left: '40%',
      zoomX: 15,
      zoomY: -15
    },
    {
      id: 'island',
      title: 'Monolith Island',
      subtitle: 'Centerpiece',
      description: 'Single-slab quartz island with integrated induction and waterfall edges.',
      top: '75%',
      left: '55%',
      zoomX: -10,
      zoomY: -30
    }
  ]
};

const IMAGES = {
  hero: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=1920",
  villaEntrance: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1920",
  livingRoom: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1920",
  kitchen: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1920",
  marbleDetail: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=1920",
  // High-quality wide images for panorama effect
  living360: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=2400",
  kitchen360: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80&w=2400",
};

function Panorama({ imageUrl, hotspots, onHotspotClick, focusedHotspot }: { 
  imageUrl: string, 
  hotspots: Hotspot[], 
  onHotspotClick: (h: Hotspot) => void,
  focusedHotspot: string | null
}) {
  const texture = useTexture(imageUrl);
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  
  useFrame((state, delta) => {
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    if (focusedHotspot) {
      const hotspot = hotspots.find(h => h.id === focusedHotspot);
      if (hotspot) {
        // Calculate target spherical coordinates
        const phi = (parseFloat(hotspot.top) / 100) * Math.PI;
        const theta = (parseFloat(hotspot.left) / 100) * Math.PI * 2;
        
        // Target position on the sphere
        const targetX = 0.1 * Math.sin(phi) * Math.cos(theta);
        const targetY = 0.1 * Math.cos(phi);
        const targetZ = 0.1 * Math.sin(phi) * Math.sin(theta);
        
        // Smoothly move camera to look at the target
        // For a 360 sphere, we rotate the camera to look outwards
        const targetLookAt = new THREE.Vector3(
          500 * Math.sin(phi) * Math.cos(theta),
          500 * Math.cos(phi),
          500 * Math.sin(phi) * Math.sin(theta)
        );
        
        perspectiveCamera.lookAt(targetLookAt);
        // We can also animate FOV for zoom effect
        perspectiveCamera.fov = THREE.MathUtils.lerp(perspectiveCamera.fov, 40, 0.05);
        perspectiveCamera.updateProjectionMatrix();
      }
    } else {
      perspectiveCamera.fov = THREE.MathUtils.lerp(perspectiveCamera.fov, 75, 0.05);
      perspectiveCamera.updateProjectionMatrix();
    }
  });

  return (
    <>
      <Sphere args={[500, 60, 40]} scale={[-1, 1, 1]}>
        <meshBasicMaterial map={texture} side={THREE.BackSide} />
      </Sphere>
      
      <OrbitControls 
        ref={controlsRef}
        enableZoom={true} 
        enablePan={false} 
        rotateSpeed={-0.5} 
        autoRotate={!focusedHotspot} 
        autoRotateSpeed={0.5}
        minDistance={0.1}
        maxDistance={100}
        enabled={!focusedHotspot}
      />
      
      {hotspots.map((hotspot) => {
        // Convert top/left percentages to spherical coordinates for 3D placement
        // This is a rough approximation for standard images mapped to a sphere
        const phi = (parseFloat(hotspot.top) / 100) * Math.PI;
        const theta = (parseFloat(hotspot.left) / 100) * Math.PI * 2;
        
        const x = 400 * Math.sin(phi) * Math.cos(theta);
        const y = 400 * Math.cos(phi);
        const z = 400 * Math.sin(phi) * Math.sin(theta);

        return (
          <Html position={[x, y, z]} key={hotspot.id} center zIndexRange={[0, 10]}>
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`group cursor-pointer transition-all duration-500 ${focusedHotspot && focusedHotspot !== hotspot.id ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              onClick={() => onHotspotClick(hotspot)}
            >
              <div className="relative flex items-center justify-center">
                <div className={`w-8 h-8 bg-[#c9a84c] rounded-full animate-ping absolute ${focusedHotspot === hotspot.id ? 'hidden' : ''}`} />
                <div className={`w-8 h-8 rounded-full relative flex items-center justify-center transition-all duration-500 shadow-2xl ${focusedHotspot === hotspot.id ? 'bg-white scale-125' : 'bg-[#c9a84c]'}`}>
                  {focusedHotspot === hotspot.id ? (
                    <X size={16} className="text-black" />
                  ) : (
                    <Maximize2 size={16} className="text-black" />
                  )}
                </div>
                
                {/* Label that appears on hover */}
                {!focusedHotspot && (
                  <div className="absolute left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-md px-4 py-2 border border-[#c9a84c]/30 rounded-sm whitespace-nowrap">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#c9a84c] font-medium">{hotspot.title}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </Html>
        );
      })}
    </>
  );
}

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [villaSection, setVillaSection] = useState<VillaSection>('living');
  const [focusedHotspot, setFocusedHotspot] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Mouse parallax values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Fly-through / Zoom values
  const zoomScale = useMotionValue(1);
  const focusX = useMotionValue(0);
  const focusY = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 120 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);
  
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-5, 5]);
  const rotateZ = useTransform(focusX, [-150, 150], [-2, 2]);
  
  // Combine parallax with focus movement
  const combinedX = useTransform([smoothX, focusX], ([mx, fx]) => {
    return (mx as number) * 40 + (fx as number);
  });
  const combinedY = useTransform([smoothY, focusY], ([my, fy]) => {
    return (my as number) * 40 + (fy as number);
  });

  useEffect(() => {
    setIsLoaded(true);
    const handleMouseMove = (e: MouseEvent) => {
      // Dampen parallax when focused
      const multiplier = focusedHotspot ? 0.2 : 1;
      mouseX.set(((e.clientX / window.innerWidth) - 0.5) * multiplier);
      mouseY.set(((e.clientY / window.innerHeight) - 0.5) * multiplier);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY, focusedHotspot]);

  const handleEnter = () => {
    setView('door');
    setTimeout(() => setView('villa'), 1500);
  };
  
  const handleExit = () => setView('exit');
  const handleBackToLanding = () => setView('landing');

  const handleHotspotClick = (hotspot: Hotspot) => {
    if (focusedHotspot === hotspot.id) {
      resetFocus();
      return;
    }
    
    setFocusedHotspot(hotspot.id);
    
    // Trigger cinematic fly-through animation
    const transition: any = { duration: 1.5, ease: [0.22, 1, 0.36, 1] };
    animate(zoomScale, 2.2 as any, transition);
    animate(focusX, (hotspot.zoomX * 6) as any, transition);
    animate(focusY, (hotspot.zoomY * 6) as any, transition);
  };

  const resetFocus = () => {
    setFocusedHotspot(null);
    const transition: any = { duration: 1.2, ease: [0.22, 1, 0.36, 1] };
    animate(zoomScale, 1 as any, transition);
    animate(focusX, 0 as any, transition);
    animate(focusY, 0 as any, transition);
  };

  const handleSectionChange = (section: VillaSection) => {
    resetFocus();
    setVillaSection(section);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f2ed] font-sans selection:bg-[#c9a84c] selection:text-black overflow-hidden">
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-screen flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Background Image with Parallax Effect */}
            <motion.div 
              style={{ x: combinedX, y: combinedY, scale: 1.1 }}
              className="absolute inset-0 z-0"
            >
              <img 
                src={IMAGES.hero} 
                alt="Luxury Interior" 
                className="w-full h-full object-cover opacity-40 grayscale-[0.2]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
            </motion.div>

            {/* Content */}
            <div className="relative z-10 text-center px-6 max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                <span className="text-[#c9a84c] uppercase tracking-[0.4em] text-xs font-medium mb-6 block">
                  Bespoke Architectural Interiors
                </span>
                <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl font-light leading-tight mb-8 tracking-tighter">
                  ALEX<span className="italic text-[#c9a84c]">ONE</span>
                </h1>
                <p className="text-lg md:text-xl text-[#b5ad9e] max-w-xl mx-auto mb-12 font-light leading-relaxed">
                  Crafting environments that resonate. Where materiality, light, and proportion converge into spaces that feel inevitable.
                </p>
              </motion.div>

              <motion.div 
                className="flex flex-col md:flex-row gap-6 justify-center items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              >
                <button 
                  onClick={handleEnter}
                  className="group relative px-12 py-5 bg-[#c9a84c] text-black font-medium tracking-widest uppercase text-xs transition-all hover:bg-[#d4b96a] hover:scale-105 active:scale-95 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Don't <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
                
                <button 
                  onClick={handleExit}
                  className="group px-12 py-5 border border-white/20 text-white font-medium tracking-widest uppercase text-xs transition-all hover:bg-white hover:text-black hover:border-white active:scale-95"
                >
                  Exit
                </button>
              </motion.div>
            </div>

            {/* Footer Info */}
            <div className="absolute bottom-10 left-10 hidden lg:block">
              <div className="flex gap-12 text-[10px] uppercase tracking-[0.3em] text-[#7a7060]">
                <div>Est. 2012</div>
                <div>London / Dubai / Mumbai</div>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'door' && (
          <motion.div
            key="door"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
          >
            <motion.div 
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 1.5, ease: [0.7, 0, 0.3, 1] }}
              className="relative w-full h-full"
            >
              <img 
                src={IMAGES.villaEntrance} 
                alt="Villa Entrance" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/20" />
            </motion.div>
          </motion.div>
        )}

        {view === 'villa' && (
          <motion.div
            key="villa"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="relative h-screen bg-black overflow-hidden"
          >
            {/* Villa Navigation UI */}
            <div className="absolute top-0 left-0 right-0 z-[100] p-8 flex justify-between items-start pointer-events-none">
              <div className="flex flex-col gap-4 pointer-events-auto">
                <button 
                  onClick={handleBackToLanding}
                  className="text-white/60 hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest text-[10px] bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 w-fit"
                >
                  <ChevronLeft size={16} /> Back to Studio
                </button>
                
                <div className="flex gap-4 bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                  <button 
                    onClick={() => handleSectionChange('living')}
                    className={`uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${villaSection === 'living' ? 'text-[#c9a84c]' : 'text-white/40 hover:text-white'}`}
                  >
                    <Compass size={12} /> Living Room
                  </button>
                  <div className="w-[1px] h-3 bg-white/10 self-center" />
                  <button 
                    onClick={() => handleSectionChange('kitchen')}
                    className={`uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${villaSection === 'kitchen' ? 'text-[#c9a84c]' : 'text-white/40 hover:text-white'}`}
                  >
                    <Compass size={12} /> Modular Kitchen
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-4 pointer-events-auto">
                <button 
                  onClick={() => setShowInfo(!showInfo)}
                  className={`p-3 rounded-full transition-all border border-white/10 backdrop-blur-md ${showInfo ? 'bg-[#c9a84c] text-black' : 'bg-black/40 text-white hover:bg-white/10'}`}
                  title="Toggle Info Panel"
                >
                  <Info size={20} />
                </button>
                {focusedHotspot && (
                  <button 
                    onClick={resetFocus}
                    className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-full transition-all flex items-center gap-2 text-[10px] uppercase tracking-widest border border-white/10 backdrop-blur-md"
                  >
                    <Minus size={14} /> Reset View
                  </button>
                )}
                <button 
                  onClick={handleExit}
                  className="bg-black/40 hover:bg-white/10 p-3 rounded-full transition-all border border-white/10 backdrop-blur-md"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* 360 Panorama View */}
            <div className="absolute inset-0 z-0">
              <Canvas camera={{ position: [0, 0, 0.1], fov: 75 }}>
                <Suspense fallback={null}>
                  <Panorama 
                    imageUrl={villaSection === 'living' ? IMAGES.living360 : IMAGES.kitchen360} 
                    hotspots={HOTSPOTS[villaSection]}
                    onHotspotClick={handleHotspotClick}
                    focusedHotspot={focusedHotspot}
                  />
                </Suspense>
              </Canvas>
              <Loader />
            </div>

            {/* Floating Info Panel (Writing Part) */}
            <AnimatePresence>
              {showInfo && !focusedHotspot && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="absolute right-8 top-1/2 -translate-y-1/2 w-80 lg:w-96 z-50 pointer-events-none"
                >
                  <div className="bg-black/80 backdrop-blur-xl p-10 border border-[#c9a84c]/20 shadow-2xl pointer-events-auto">
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[#c9a84c] uppercase tracking-[0.4em] text-[10px]">The Grand Villa</span>
                      <button onClick={() => setShowInfo(false)} className="text-white/40 hover:text-white transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                    <h2 className="font-serif text-4xl font-light mb-6 leading-tight">
                      {villaSection === 'living' ? (
                        <>Living<br /><span className="italic">Sanctuary</span></>
                      ) : (
                        <>Culinary<br /><span className="italic">Atelier</span></>
                      )}
                    </h2>
                    <p className="text-[#b5ad9e] font-light leading-relaxed mb-8 text-sm">
                      {villaSection === 'living' 
                        ? "Experience the convergence of luxury and comfort. Our living spaces are designed to be both a gallery of fine materials and a sanctuary for daily life."
                        : "Where precision meets aesthetics. Our modular kitchens are engineered for performance while maintaining a seamless, architectural look."
                      }
                    </p>
                    <div className="grid grid-cols-2 gap-6 mb-10">
                      <div>
                        <div className="text-[#c9a84c] text-lg font-serif mb-1 italic">
                          {villaSection === 'living' ? '12ft' : 'Quartz'}
                        </div>
                        <div className="text-[8px] uppercase tracking-widest text-white/40">
                          {villaSection === 'living' ? 'Ceiling Height' : 'Countertops'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#c9a84c] text-lg font-serif mb-1 italic">
                          {villaSection === 'living' ? 'Smart' : 'Miele'}
                        </div>
                        <div className="text-[8px] uppercase tracking-widest text-white/40">
                          {villaSection === 'living' ? 'Home Integration' : 'Appliances'}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleSectionChange(villaSection === 'living' ? 'kitchen' : 'living')}
                      className="group flex items-center gap-4 text-[10px] uppercase tracking-[0.4em] text-[#c9a84c] hover:text-white transition-colors w-full justify-between border-t border-white/10 pt-6"
                    >
                      <span>{villaSection === 'living' ? 'Explore Kitchen' : 'Back to Living'}</span>
                      <ChevronRight size={14} className={`transition-transform ${villaSection === 'living' ? 'group-hover:translate-x-1' : 'rotate-180 group-hover:-translate-x-1'}`} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Focused Hotspot Info */}
            <AnimatePresence>
              {focusedHotspot && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-6"
                >
                  {HOTSPOTS[villaSection].filter(h => h.id === focusedHotspot).map(hotspot => (
                    <div key={hotspot.id} className="bg-black/90 backdrop-blur-2xl p-8 border border-[#c9a84c]/40 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#c9a84c]" />
                      <div className="text-[10px] uppercase tracking-[0.4em] text-[#c9a84c] mb-3 font-medium">{hotspot.subtitle}</div>
                      <h3 className="font-serif text-3xl mb-4 italic text-white">{hotspot.title}</h3>
                      <p className="text-[12px] text-[#b5ad9e] leading-relaxed tracking-wider mb-6 font-light">{hotspot.description}</p>
                      <button 
                        onClick={resetFocus}
                        className="text-[8px] uppercase tracking-[0.3em] text-white/40 hover:text-[#c9a84c] transition-colors flex items-center gap-2"
                      >
                        <Minus size={12} /> Click to return to panorama
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Hint */}
            <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 text-[8px] uppercase tracking-[0.5em] text-white/30 transition-opacity duration-500 ${focusedHotspot ? 'opacity-0' : 'opacity-100'}`}>
              <div className="w-12 h-[1px] bg-white/10" />
              Drag to look around • Scroll to zoom
              <div className="w-12 h-[1px] bg-white/10" />
            </div>
          </motion.div>
        )}

        {view === 'exit' && (
          <motion.div
            key="exit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-2xl"
            >
              <div className="w-20 h-[1px] bg-[#c9a84c] mx-auto mb-12" />
              <h2 className="font-serif text-5xl md:text-7xl font-light mb-8 italic">Au Revoir</h2>
              <p className="text-[#b5ad9e] text-lg font-light leading-relaxed mb-16">
                Thank you for exploring the world of ALEXONE. Our team of visionaries is ready to transform your space into a masterpiece.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Phone size={20} className="text-[#c9a84c]" />
                  <span className="text-[10px] uppercase tracking-widest text-white/40">Call Us</span>
                  <span className="text-sm">+44 20 7946 0123</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <Mail size={20} className="text-[#c9a84c]" />
                  <span className="text-[10px] uppercase tracking-widest text-white/40">Email</span>
                  <span className="text-sm">studio@alexone.design</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <MapPin size={20} className="text-[#c9a84c]" />
                  <span className="text-[10px] uppercase tracking-widest text-white/40">Visit</span>
                  <span className="text-sm">Mayfair, London</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 justify-center">
                <button 
                  onClick={() => window.location.reload()}
                  className="px-12 py-5 bg-[#c9a84c] text-black font-medium tracking-widest uppercase text-xs transition-all hover:bg-[#d4b96a]"
                >
                  Start Over
                </button>
                <button className="px-12 py-5 border border-white/20 text-white font-medium tracking-widest uppercase text-xs transition-all hover:bg-white hover:text-black">
                  Inquire Now
                </button>
              </div>

              <div className="mt-24 flex justify-center gap-8 text-white/20">
                <Instagram size={20} className="hover:text-[#c9a84c] cursor-pointer transition-colors" />
                <Linkedin size={20} className="hover:text-[#c9a84c] cursor-pointer transition-colors" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}
