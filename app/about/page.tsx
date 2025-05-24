'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function AboutPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  
  useGSAP(() => {
    // Clean up any existing animations to prevent conflicts
    if (ScrollTrigger.getAll().length) {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    }
    
    // Header animation
    gsap.fromTo(
      '.about-header-content',
      { 
        opacity: 0,
        y: 30 
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power2.out',
      }
    );
    
    // Our Story section animation
    gsap.fromTo(
      '.story-image',
      { 
        opacity: 0,
        x: -50 
      },
      {
        opacity: 1,
        x: 0,
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: storyRef.current,
          start: 'top 70%',
        }
      }
    );
    
    gsap.fromTo(
      '.story-content',
      { 
        opacity: 0,
        x: 50 
      },
      {
        opacity: 1,
        x: 0,
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: storyRef.current,
          start: 'top 70%',
        }
      }
    );
    
    // Values animation - stagger effect
    gsap.fromTo(
      '.value-item',
      { 
        opacity: 0,
        y: 30 
      },
      {
        opacity: 1,
        y: 0,
        stagger: 0.2,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: valuesRef.current,
          start: 'top 75%',
        }
      }
    );

    // Stats counter animation
    gsap.fromTo(
      '.stat-item',
      { 
        opacity: 0,
        y: 20 
      },
      {
        opacity: 1,
        y: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top 80%',
        }
      }
    );
    
    // Team section animation - fade in
    gsap.fromTo(
      '.team-header, .team-member',
      { 
        opacity: 0,
        y: 20 
      },
      {
        opacity: 1,
        y: 0,
        stagger: 0.2,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: teamRef.current,
          start: 'top 75%',
        }
      }
    );
    
    return () => {
      // Clean up on unmount
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);
  
  return (
    <div ref={pageRef} className="bg-white">
      {/* Hero section with full width image */}
      <div ref={headerRef} className="relative h-[85vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/about-banner.png"
            alt="About Hikari"
            fill
            style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
            priority
            className="transition-transform duration-10000 ease-in-out hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 bg-gradient-to-b from-black/60 via-black/40 to-black/20"></div>
        </div>
        
        <div className="about-header-content relative h-full flex flex-col justify-center items-center z-10 px-6 text-center">
          <span className="text-white/80 uppercase tracking-widest text-sm mb-2">Est. 2023</span>
          <h1 className="text-5xl md:text-7xl font-monument mb-6 text-white leading-tight">About HIKARI</h1>
          <div className="w-16 h-px bg-white mx-auto mb-8"></div>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl font-karla leading-relaxed">
            Crafting minimal, timeless fashion that transcends seasonal trends.
          </p>
          <a href="#story" className="absolute bottom-12 animate-bounce">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
        </div>
      </div>
      
      {/* Breadcrumbs - Added below hero section */}
      <div className="w-full px-4 md:px-8 lg:px-16 xl:px-24 pt-8">
        <div className="mb-8 mt-2 md:mt-4 text-sm text-neutral-500">
          <Link href="/" className="hover:text-neutral-900 transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-900">About</span>
        </div>
      </div>
      
      {/* Our Story section */}
      <div id="story" ref={storyRef} className="py-28 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
          <div className="story-image relative aspect-[4/5] w-full">
            <div className="absolute inset-0 border border-neutral-200 -translate-x-4 -translate-y-4"></div>
            <Image 
              src="/images/dual-image-left.png"
              alt="Our Story"
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-sm shadow-xl"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          
          <div className="story-content">
            <span className="text-neutral-500 uppercase tracking-widest text-xs mb-2 block">Our Journey</span>
            <h2 className="text-3xl md:text-4xl font-monument mb-6">Our Story</h2>
            <div className="w-12 h-px bg-neutral-300 mb-8"></div>
            <div className="prose prose-lg font-karla text-neutral-700">
              <p className="mb-6 leading-relaxed">
                Founded in 2023, HIKARI started with a simple vision: to create minimal, timeless clothing that transcends seasonal trends and fads. Our name, meaning "light" in Japanese, reflects our commitment to simplicity, clarity, and illumination in fashion.
              </p>
              <p className="mb-6 leading-relaxed">
                What began as a small collection of essential pieces has grown into a comprehensive range of clothing that serves as the foundation of a thoughtful wardrobe. Each design is carefully considered, with a focus on form, function, and sustainability.
              </p>
              <p className="leading-relaxed">
                Today, HIKARI continues to evolve while staying true to our founding principles. We believe in creating pieces that last, both in terms of durability and style, reducing the need for constant consumption and contributing to a more sustainable approach to fashion.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Stats Section */}
      <div ref={statsRef} className="py-20 px-6 bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { number: "100+", label: "Products" },
              { number: "15", label: "Countries Shipped" },
              { number: "5,000+", label: "Happy Customers" },
              { number: "30%", label: "Sustainable Materials" }
            ].map((stat, index) => (
              <div key={index} className="stat-item p-6">
                <div className="text-4xl md:text-5xl font-monument mb-3">{stat.number}</div>
                <div className="uppercase tracking-wider text-white/70 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Our Values section */}
      <div ref={valuesRef} className="py-28 px-6 bg-neutral-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-neutral-500 uppercase tracking-widest text-xs mb-2 block">What We Believe</span>
            <h2 className="text-3xl md:text-4xl font-monument mb-4">Our Values</h2>
            <div className="w-12 h-px bg-neutral-300 mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                title: "Timeless Design", 
                description: "We create pieces that transcend trends and seasons, focusing on clean lines and versatile silhouettes that remain relevant year after year.",
                icon: "✧"
              },
              { 
                title: "Quality Craftsmanship", 
                description: "Every garment is meticulously constructed with attention to detail, ensuring longevity and a perfect fit that improves with time.",
                icon: "✧"
              },
              { 
                title: "Sustainable Practices", 
                description: "We prioritize environmental responsibility by using eco-friendly materials, ethical manufacturing processes, and minimal waste production.",
                icon: "✧" 
              }
            ].map((value, index) => (
              <div key={index} className="value-item group">
                <div className="bg-white p-10 rounded-sm shadow-sm hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
                  <div className="text-2xl mb-6 group-hover:scale-110 transition-transform duration-300">{value.icon}</div>
                  <h3 className="font-monument text-xl mb-4">{value.title}</h3>
                  <p className="text-neutral-700 font-karla leading-relaxed">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div ref={teamRef} className="py-28 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 team-header">
            <span className="text-neutral-500 uppercase tracking-widest text-xs mb-2 block">The People Behind HIKARI</span>
            <h2 className="text-3xl md:text-4xl font-monument mb-4">Our Team</h2>
            <div className="w-12 h-px bg-neutral-300 mx-auto mb-4"></div>
            <p className="max-w-2xl mx-auto text-neutral-700">Meet the passionate individuals who bring HIKARI's vision to life through their dedication and expertise.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              {
                name: "Yuki Tanaka",
                position: "Founder & Creative Director",
                image: "/images/team-1.jpg",
                bio: "With a background in fashion design and a passion for minimalism, Yuki founded HIKARI to create timeless pieces that stand the test of time."
              },
              {
                name: "Alex Chen",
                position: "Head of Production",
                image: "/images/team-2.jpg",
                bio: "Alex oversees our production processes, ensuring each garment meets our high standards for quality and sustainability."
              },
              {
                name: "Sofia Rodriguez",
                position: "Design Lead",
                image: "/images/team-3.jpg",
                bio: "Sofia brings fresh perspectives to our collections while maintaining HIKARI's commitment to clean lines and versatile silhouettes."
              }
            ].map((member, index) => (
              <div key={index} className="team-member group">
                <div className="relative aspect-[3/4] mb-6 overflow-hidden">
                  <div className="absolute inset-0 bg-neutral-200 flex items-center justify-center text-neutral-400">
                    <span className="text-xl">Image</span>
                  </div>
                  {/* Note: Replace with actual team images when available */}
                  <div className="absolute inset-0 group-hover:bg-black/20 transition-colors duration-300"></div>
                </div>
                <h3 className="font-monument text-xl mb-1">{member.name}</h3>
                <p className="text-neutral-500 text-sm mb-3">{member.position}</p>
                <p className="text-neutral-700 font-karla">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-28 px-6 bg-neutral-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-monument mb-6">Experience HIKARI</h2>
          <p className="text-white/80 mb-10 text-lg leading-relaxed">
            Discover our latest collection and experience the quality, craftsmanship, and timeless design that defines HIKARI.
          </p>
          <Link 
            href="/shop" 
            className="inline-block bg-white text-neutral-900 px-8 py-4 rounded-sm text-sm uppercase tracking-wider font-karla hover:bg-neutral-100 transition-colors duration-300"
          >
            Shop Collection
          </Link>
        </div>
      </div>
    </div>
  );
} 