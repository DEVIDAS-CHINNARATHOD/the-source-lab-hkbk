import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { Pause, Play } from 'lucide-react';
import Skiper39 from '@/components/ui/skiper39';
import './styles/globals.css';

function HeroMotion({control}: {control: HTMLElement}) {
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const changed = () => setPaused(media.matches);
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.heroMotion = paused ? 'paused' : 'running';
    return () => { delete document.documentElement.dataset.heroMotion; };
  }, [paused]);
  return <><Skiper39 paused={paused} />{createPortal(
    <button className="motion-button" aria-label={paused ? 'Play animations' : 'Pause animations'}
      title={paused ? 'Play animations' : 'Pause animations'} onClick={() => setPaused(!paused)}>
      {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
    </button>, control)}</>;
}
const crowd = document.getElementById('hero-crowd');
const control = document.getElementById('motion-control');
if (crowd && control) createRoot(crowd).render(<HeroMotion control={control} />);
