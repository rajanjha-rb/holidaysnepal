"use client";

import React, { useMemo, useCallback, useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FaFacebook } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";
import { team as defaultTeam } from "@/data/team";

interface TeamProps {
  team?: typeof defaultTeam;
}

const roles = ["Chairperson", "Director", "Manager"];

// Enhanced lazy loading image component with shadcn skeleton
const LazyTeamImage = ({ src, alt }: { 
  src: string; 
  alt: string; 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const loadImage = () => {
      const img = new window.Image();
      
      img.onload = () => {
        setIsLoaded(true);
        setIsError(false);
      };
      
      img.onerror = () => {
        if (retryCount < 2) {
          // Retry loading the image
          setRetryCount(prev => prev + 1);
          setTimeout(() => loadImage(), 1000);
        } else {
          setIsError(true);
        }
      };
      
      img.src = src;
    };

    loadImage();
  }, [src, retryCount]);

  return (
    <div className="w-full max-w-xs aspect-square flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl relative bg-gray-800">
      {/* Skeleton loading placeholder using shadcn */}
      {!isLoaded && !isError && (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 space-y-6">
          {/* Skeleton avatar */}
          <Skeleton className="w-28 h-28 rounded-full" />
          
          {/* Skeleton content structure */}
          <div className="w-full space-y-4">
            {/* Name skeleton */}
            <div className="text-center">
              <Skeleton className="w-40 h-8 mx-auto mb-2" />
              <Skeleton className="w-24 h-5 mx-auto" />
            </div>
            
            {/* Description skeleton */}
            <div className="space-y-2">
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-3/4 h-4" />
              <Skeleton className="w-1/2 h-4" />
            </div>
            
            {/* Social buttons skeleton */}
            <div className="flex justify-center space-x-3 pt-2">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="w-10 h-10 rounded-full" />
            </div>
          </div>
        </div>
      )}
      
      {/* Error placeholder */}
      {isError && (
        <div className="w-full h-full flex items-center justify-center bg-gray-700 rounded-2xl">
          <div className="text-gray-400 text-center">
            <div className="text-4xl mb-2">👤</div>
            <div className="text-sm">Image not available</div>
          </div>
        </div>
      )}
      
      {/* Actual image with smooth transition */}
      {isLoaded && (
        <Image
          src={src}
          alt={alt}
          width={400}
          height={400}
          className="w-full h-full object-cover object-center select-none transition-all duration-500 ease-out"
          draggable={false}
          quality={75}
        />
      )}
    </div>
  );
};

// Memoized component to prevent unnecessary re-renders
const TeamMember = React.memo(({ member }: {
  member: typeof defaultTeam[0];
}) => {
  return (
    <section className="max-w-5xl w-full flex flex-col md:flex-row items-center gap-10 md:gap-16 mx-auto">
      {/* Lazy Loading Image */}
      <LazyTeamImage 
        src={member.image} 
        alt={member.name} 
      />
      
      {/* Info - Shows immediately with smooth animation */}
      <div className="flex-1 flex flex-col justify-center items-start text-left animate-fadein">
        <h2 className="text-3xl md:text-4xl font-extrabold text-black mb-2">{member.name}</h2>
        <div className="text-lg text-yellow-400 font-bold mb-2 uppercase tracking-wide">{member.position}</div>
        <div className="text-xl text-gray-700 mb-8 max-w-xl leading-relaxed">{member.description}</div>
        <div className="flex gap-4 mb-8">
          <Button asChild variant="ghost" size="icon" className="hover:bg-blue-900/20">
            <a href={member.socials.facebook} aria-label="Facebook" target="_blank" rel="noopener noreferrer">
              <FaFacebook className="text-blue-500 text-2xl" />
            </a>
          </Button>
          <Button asChild variant="ghost" size="icon" className="hover:bg-pink-900/20">
            <a href={member.socials.instagram} aria-label="Instagram" target="_blank" rel="noopener noreferrer">
              <FaInstagram className="text-pink-400 text-2xl" />
            </a>
          </Button>
          <Button asChild variant="ghost" size="icon" className="hover:bg-blue-900/20">
            <a href={member.socials.linkedin} aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
              <FaLinkedin className="text-blue-300 text-2xl" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
});

TeamMember.displayName = 'TeamMember';



export default function Team({ team = defaultTeam }: TeamProps) {
  const [idx, setIdx] = React.useState(0);
  
  // Preload all team images for better performance
  React.useEffect(() => {
    const preloadImages = () => {
      team.forEach(member => {
        const img = new window.Image();
        img.src = member.image;
      });
    };
    
    preloadImages();
  }, [team]);
  
  // Memoize the current member to prevent unnecessary re-renders
  const member = useMemo(() => team[idx], [team, idx]);
  
  // Memoize role indices to avoid recalculating on every render
  const roleIndices = useMemo(() => {
    return roles.map(role => team.findIndex((m) => m.position.toLowerCase() === role.toLowerCase()));
  }, [team]);

  // Auto-advance every 8 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setIdx((prev) => (prev + 1) % team.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [team.length]);

  // Memoize click handlers
  const handleRoleClick = useCallback((teamIdx: number) => {
    if (teamIdx !== -1) {
      setIdx(teamIdx);
    }
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 bg-white/90 border border-gray-200 rounded-xl px-4 py-2 mb-10 shadow-sm">
        {roles.map((role, i) => {
          const teamIdx = roleIndices[i];
          const isActive = teamIdx === idx;
          return (
            <button
              key={role}
              onClick={() => handleRoleClick(teamIdx)}
              className={`px-3 py-1 font-semibold text-base focus:outline-none transition-colors border-0 bg-transparent
                ${isActive ? "text-black" : "text-gray-500 hover:text-black"}
                ${i !== 0 ? "border-l border-gray-300" : ""}
                relative`}
              style={{ outline: "none" }}
            >
              <span className="relative z-10">{role}</span>
              {isActive && (
                <span className="absolute left-0 -bottom-1 w-full h-1 bg-black rounded-full" />
              )}
            </button>
          );
        })}
      </div>
      
      <TeamMember 
        member={member} 
      />
      
      {/* Animations */}
      <style jsx>{`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadein {
          animation: fadein 1.2s cubic-bezier(0.4,0,0.2,1) both;
        }
      `}</style>
    </div>
  );
} 