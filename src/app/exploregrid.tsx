"use client";

import { useState, useEffect } from "react";
import { CardContainer, CardBody } from "./components/3d-card"; // Assuming the path is correct

const ExploreGrid = () => {
  interface Image {
    id: string;
    url: string;
    username?: string;
    tags?: string[];
    prompt?: string;
    initialLiked?: boolean; 
    likes: number; 
    initialLikes: number; 
  }

  const [images, setImages] = useState<Image[]>([]);

  useEffect(() => {
    const fetchImages = async () => {
      console.log("Fetching images from /api/public");
      const response = await fetch('http://127.0.0.1:5001/api/public'); 
      if (!response.ok) {
        console.error('Failed to fetch images:', response.statusText);
        return;
      }
      
      const data = await response.json();
      console.log("Images fetched successfully:", data.images);

      // Debugging: Log each image's likes
      data.images.forEach((img: Image) => {
        console.log(`Image ID: ${img.id}, Likes: ${img.likes}`);
      });

      // Map the likes property to initialLikes
      const mappedImages = data.images.map((img: Image) => ({
        ...img,
        initialLikes: img.likes,
      }));

      setImages(mappedImages);
    };

    fetchImages();
  }, []);

  useEffect(() => {
    console.log("Images state updated:", images);
  }, [images]);

  return (
    <div className="flex flex-col items-center">
      <div className="text-4xl font-bold mb-8 text-red-600">Explore</div>
      <div className="grid grid-cols-2 gap-4">
        {images.map((img) => (
          <CardContainer key={img.id} containerClassName="m-4">
            <CardBody
              id={img.id}
              image={img.url}
              username={img.username || "Unknown"} // Adding a default if username is not provided
              tags={img.tags || []}
              prompt={img.prompt || "No Description"} // Adding a default if prompt is not provided
              initialLikes={img.initialLikes || 0} // Adding a default if initialLikes is not provided
              initialLiked={img.initialLiked || false} // Adding a default if initialLiked is not provided
            />
          </CardContainer>
        ))}
      </div>
    </div>
  );
};

export default ExploreGrid;