import Hero from './components/home/Hero';
import Marquee from './components/home/Marquee';
import BestProducts from './components/home/BestProducts';
import AboutBanner from './components/home/AboutBanner';
import MaterialsPromo from './components/home/MaterialsPromo';
import DualImageSection from './components/home/DualImageSection';
import ProductAdvantagesSection from './components/home/ProductAdvantagesSection';
import InstagramFeed from './components/home/InstagramFeed';

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <BestProducts />
      <AboutBanner />
      <MaterialsPromo />
      <DualImageSection />
      <ProductAdvantagesSection />
      <InstagramFeed />
    </>
  );
} 