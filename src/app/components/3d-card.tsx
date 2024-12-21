"use client";

import { cn } from "../lib/utils";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faComment, faShare } from "@fortawesome/free-solid-svg-icons";
import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useEffect,
} from "react";

const MouseEnterContext = createContext<
  [boolean, React.Dispatch<React.SetStateAction<boolean>>] | undefined
>(undefined);

export const CardContainer = ({
  children,
  containerClassName,
}: {
  children?: React.ReactNode;
  containerClassName?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseEntered, setIsMouseEntered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 10; 
    const y = (e.clientY - top - height / 2) / 10; 
    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${y}deg) scale(1.05)`; 
  };

  const handleMouseEnter = () => {
    setIsMouseEntered(true);
    if (containerRef.current) {
      containerRef.current.style.transform = `scale(1.05)`; 
    }
  };

  const handleMouseLeave = () => {
    setIsMouseEntered(false);
    if (containerRef.current) {
      containerRef.current.style.transform = `rotateY(0deg) rotateX(0deg) scale(1)`; // Reset scale effect
    }
  };

  return (
    <MouseEnterContext.Provider value={[isMouseEntered, setIsMouseEntered]}>
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "py-20 flex items-center justify-center transition-all duration-200 ease-linear",
          containerClassName,
          "perspective-1000"
        )}
        style={{
          perspective: "1000px",
          transformStyle: "preserve-3d"
        }}
      >
        {children}
      </div>
    </MouseEnterContext.Provider>
  );
};

export const CardBody = ({
  id,
  image,
  username,
  tags,
  prompt,
  initialLiked,
  initialLikes,
}: {
  id: string;
  image: string;
  username: string;
  tags: string[];
  prompt: string;
  initialLiked: boolean;
  initialLikes: number;
}) => {
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkIfLiked = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5001/api/isliked?username=${username}&imageId=${id}`);
        if (response.ok) {
          const data = await response.json();
          setLiked(data.isLiked);
        }
      } catch (error) {
        console.error("Error checking like status:", error);
      }
    };

    checkIfLiked();
  }, [username, id]);

  const toggleLike = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`http://127.0.0.1:5001/api/${liked ? "unlike" : "like"}`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, imageId: id }),
      });
      if (!response.ok) {
        throw new Error('Failed to update like status');
      }
      const data = await response.json();
      setLiked(!liked);
      setLikes(data.likes);
    } catch (error) {
      console.error("Error updating like status:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ensure tags is an array
  const tagsArray = Array.isArray(tags) ? tags : [];

  // Function to generate a random color
  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // Function to get color for a tag from session storage or generate a new one
  const getColorForTag = (tag: string) => {
    const storedColors = JSON.parse(sessionStorage.getItem('tagColors') || '{}');
    if (!storedColors[tag]) {
      storedColors[tag] = getRandomColor();
      sessionStorage.setItem('tagColors', JSON.stringify(storedColors));
    }
    return storedColors[tag];
  };

  return (
    <CardItem className="h-120 w-120 transform-style-preserve-3d flex flex-col items-center justify-center bg-black bg-opacity-50 shadow-lg rounded-lg p-4 m-4" translateZ={50}>
      <div className="flex flex-wrap justify-center mb-2">
        {tagsArray.map((tag) => (
          <span
            key={tag}
            className="text-sm italic m-1 px-2 py-1 rounded"
            style={{ backgroundColor: getColorForTag(tag) }}
          >
            #{tag}
          </span>
        ))}
      </div>
      <h2 className="text-xl font-semibold text-white">{tagsArray.join(', ')}</h2>
      <h3 className="text-md text-gray-300">By {username}</h3>
      <div
        className="relative w-full h-80 transition-transform duration-200 ease-linear"
      >
        <Image src={image} alt={prompt} layout="fill" objectFit="cover" className="rounded-lg" />
      </div>
      <p className="text-gray-300 mt-2">{prompt}</p>
      <div className="flex space-x-4 mt-4">
        <button
          onClick={toggleLike}
          disabled={isSubmitting}
          className={`btn flex items-center justify-center px-4 py-2 text-white rounded hover:bg-blue-600 transition-transform duration-200 ease-linear ${liked ? 'bg-blue-500' : 'bg-transparent border border-white'}`}
          style={{ transformStyle: "preserve-3d" }}
        >
          <FontAwesomeIcon icon={faHeart} className="mr-2" /> {liked ? "Unlike" : "Like"} ({likes})
        </button>

        <button
          className="btn flex items-center justify-center px-4 py-2 text-white rounded hover:bg-blue-600 transition-transform duration-200 ease-linear bg-transparent border border-white"
          style={{ transformStyle: "preserve-3d" }}
        >
          <FontAwesomeIcon icon={faComment} className="mr-2" /> Comment
        </button>

        <button
          className="btn flex items-center justify-center px-4 py-2 text-white rounded hover:bg-blue-600 transition-transform duration-200 ease-linear bg-transparent border border-white"
          style={{ transformStyle: "preserve-3d" }}
        >
          <FontAwesomeIcon icon={faShare} className="mr-2" /> Share
        </button>
      </div>
    </CardItem>
  );
};

export const CardItem = ({
  children,
  className,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  as: Tag = "div",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  translateX?: number | string;
  translateY?: number | string;
  translateZ?: number | string;
  rotateX?: number | string;
  rotateY?: number | string;
  rotateZ?: number | string;
  as?: React.ElementType;
  [key: string]: unknown;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isMouseEntered] = useMouseEnter();

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.transform = isMouseEntered
      ? `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`
      : `translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`;
  }, [isMouseEntered, translateX, translateY, translateZ, rotateX, rotateY, rotateZ]);

  return (
    <Tag
      ref={ref}
      className={cn("w-fit transition duration-200 ease-linear transform-style-preserve-3d", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export const useMouseEnter = () => {
  const context = useContext(MouseEnterContext);
  if (context === undefined) {
    throw new Error("useMouseEnter must be used within a MouseEnterProvider");
  }
  return context;
};